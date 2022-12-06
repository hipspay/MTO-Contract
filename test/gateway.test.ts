import { ethers, waffle } from "hardhat";
import { expect } from "chai";
import { Gateway } from '../typechain-types/contracts/Gateway';
import { MTOToken } from '../typechain-types/contracts/MTOToken';
import { ContractReceipt, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function getCurrentUnixTime():Promise<number>{
  return (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
}
describe("Token",  function () {

    let gateway: Gateway;
    let mtoToken: MTOToken;
    let amountToWei:any;
    
    const ONE_SECOND:number = 10000;
    const TWENTY_MINUTES: number = 20000;
    const APPROVE:number = 4;
    const REJECT:number = 5;
    const mintAmount:number = 2000;
    const escrowId:number = 1;
    const disputeId:number = 1;
    const productId:number = 1;
    const amount:number = 100;

    let escrowDisputableTime:number;
    let escrowWithdrawableTime:number;

    let merchant:SignerWithAddress;
    let owner:SignerWithAddress;
    let participant1:SignerWithAddress;
    let participant2:SignerWithAddress;
    let participant3:SignerWithAddress;
    let participant4:SignerWithAddress;
    let participant5:SignerWithAddress;
    let participant6:SignerWithAddress;
    let participant7:SignerWithAddress;

    beforeEach(async () => {
      const GatewayContract = await ethers.getContractFactory("Gateway");
      const MTOTokenContract = await ethers.getContractFactory("MTOToken");
      mtoToken = (await MTOTokenContract.deploy(mintAmount)) as MTOToken;
      gateway = (await GatewayContract.deploy(mtoToken.address)) as Gateway;
      [owner, merchant, participant1, participant2, participant3, participant4, participant5, participant6, participant7] = await ethers.getSigners();
      amountToWei = ethers.utils.parseEther(mintAmount.toString());

      await mtoToken.connect(participant1 as Signer).mint(amountToWei);
      await mtoToken.connect(participant2 as Signer).mint(amountToWei);
      await mtoToken.connect(participant3 as Signer).mint(amountToWei);
      await mtoToken.connect(participant4 as Signer).mint(amountToWei);
      await mtoToken.connect(participant5 as Signer).mint(amountToWei);
      await mtoToken.connect(participant6 as Signer).mint(amountToWei);
      await mtoToken.connect(participant7 as Signer).mint(amountToWei);
    });
  
  it("Gateway utility token should match", async function () {
    const token = await gateway.token()
    expect(mtoToken.address).to.eq(token)
  });

  it("Gateway initialAgentScore should match", async function () {
    const initialAgentScore = await gateway.initialAgentScore()
    expect(initialAgentScore).to.eq(100)
  });

  it("Gateway scoreUp should match", async function () {
    const scoreUp = await gateway.scoreUp()
    expect(scoreUp).to.eq(10)
  });

  it("Gateway scoreDown token should match", async function () {
    const scoreDown = await gateway.scoreDown()
    expect(scoreDown).to.eq(10)
  });
  it("Gateway: create a purchase, amount no approved", async function () {
    escrowDisputableTime = Math.round(Date.now()/1000) + 10; // now + 30 seconds
    escrowWithdrawableTime = Math.round(Date.now()/1000) + 120 // now + 2 minutes
    try {
      const result = await gateway.purchase(
        productId,
        merchant.address,
        amount,
        escrowDisputableTime,
        escrowWithdrawableTime
      )
    } catch (e:any) {
      expect(e.message).to.contain("You should approve token transfer to this contract first");
    }
  })

  it("Gateway: create a purchase, amount approved", async function () {
      escrowDisputableTime = await getCurrentUnixTime() + 10; // now + 30 seconds
      escrowWithdrawableTime = await getCurrentUnixTime() + 120 // now + 2 minutes
      await mtoToken.approve(gateway.address, amount);
      const tx = await gateway.purchase(
        productId,
        merchant.address,
        amount,
        escrowDisputableTime,
        escrowWithdrawableTime
      )
      let receipt:ContractReceipt  = await tx.wait();
      const escrow:any = receipt.events?.filter((x) => {return x.event == "Escrowed"});
      const _amount = escrow[0].args['_amount'].toString();
      expect(amount.toString()).to.equals(_amount);
  })

  it("Gateway: test ATM flow approve dispute", async function () {
    await mtoToken.approve(gateway.address, amount);
    escrowDisputableTime = await getCurrentUnixTime() + 10; // now + 30 seconds
    escrowWithdrawableTime = await getCurrentUnixTime() + 120; // now + 120 // now + 2 minutes
    const tx = await gateway.purchase(
      productId,
      merchant.address,
      amount,
      escrowDisputableTime,
      escrowWithdrawableTime
    )
    await new Promise(resolve => setTimeout(resolve, ONE_SECOND));
    await gateway.startDispute(
      escrowId
    )
    await gateway.applyADM(disputeId, APPROVE)//approve dispute
    expect((await mtoToken.balanceOf(merchant.address)).toString()).to.equal('0');
    expect((await mtoToken.balanceOf(owner.address)).toString()).to.equal('2000');  
  })

  it("Gateway: test ATM flow reject dispute", async function () {
    escrowDisputableTime = await getCurrentUnixTime() + 10; // now + 30 seconds
    escrowWithdrawableTime = await getCurrentUnixTime() + 120 // now + 2 minutes
    await mtoToken.approve(gateway.address, amount);
    const tx = await gateway.purchase(
      productId,
      merchant.address,
      amount,
      escrowDisputableTime,
      escrowWithdrawableTime
    )
 
    await new Promise(resolve => setTimeout(resolve, ONE_SECOND));// wait 30 second
    await gateway.startDispute(
      disputeId,
    )
    await gateway.applyADM(disputeId, REJECT) // reject dispute
    expect((await mtoToken.balanceOf(owner.address)).toString()).to.equal('1900');  
    expect((await mtoToken.balanceOf(merchant.address)).toString()).to.equal('100');  
  })

  it("Gateway: test CTM flow reject dispute", async function () {
    escrowDisputableTime = await getCurrentUnixTime() + 10; // now + 30 seconds
    escrowWithdrawableTime = await getCurrentUnixTime() + 120 // now + 2 minutes
    await mtoToken.approve(gateway.address, amount);
    await gateway.purchase(
      productId,
      merchant.address,
      amount,
      escrowDisputableTime,
      escrowWithdrawableTime
    )
    await mtoToken.connect(participant1 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant2 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant3 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant4 as Signer).approve(gateway.address, amountToWei);
   

    await gateway.connect(participant1 as Signer).participate();
    await gateway.connect(participant2 as Signer).participate();
    await gateway.connect(participant3 as Signer).participate();
    await gateway.connect(participant4 as Signer).participate();
  
    await new Promise(resolve => setTimeout(resolve, ONE_SECOND));
    await gateway.startDispute(
      disputeId,
    )
    await gateway.connect(participant1 as Signer).pickDispute(disputeId);
    await gateway.connect(participant1 as Signer).submit(disputeId, APPROVE);  

    await gateway.connect(participant2 as Signer).pickDispute(disputeId);
    await gateway.connect(participant2 as Signer).submit(disputeId, REJECT);


    await gateway.connect(participant3 as Signer).pickDispute(disputeId);
    await gateway.connect(participant3 as Signer).submit(disputeId, APPROVE); 

    await gateway.connect(participant4 as Signer).pickDispute(disputeId);
    await gateway.connect(participant4 as Signer).submit(disputeId, APPROVE); 

    expect((await mtoToken.balanceOf(owner.address)).toString()).to.equal(mintAmount.toString());  
    expect((await mtoToken.balanceOf(merchant.address)).toString()).to.equal('0');

  });
  it("Gateway: exceed applied agents ", async function () {
    escrowDisputableTime = await getCurrentUnixTime() + 10; // now + 30 seconds
    escrowWithdrawableTime = await getCurrentUnixTime() + 120 // now + 2 minutes
    await mtoToken.approve(gateway.address, amount);
    await gateway.purchase(
      productId,
      merchant.address,
      amount,
      escrowDisputableTime,
      escrowWithdrawableTime
    )
    await mtoToken.connect(participant1 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant2 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant3 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant4 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant5 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant6 as Signer).approve(gateway.address, amountToWei);


    await gateway.connect(participant1 as Signer).participate();
    await gateway.connect(participant2 as Signer).participate();
    await gateway.connect(participant3 as Signer).participate();
    await gateway.connect(participant4 as Signer).participate();
    await gateway.connect(participant5 as Signer).participate();
    await gateway.connect(participant6 as Signer).participate();

    await new Promise(resolve => setTimeout(resolve, ONE_SECOND));
    await gateway.startDispute(
      disputeId,
    )
    await gateway.connect(participant1 as Signer).pickDispute(disputeId);
    await gateway.connect(participant2 as Signer).pickDispute(disputeId);
    await gateway.connect(participant3 as Signer).pickDispute(disputeId);
    await gateway.connect(participant4 as Signer).pickDispute(disputeId);
    await gateway.connect(participant5 as Signer).pickDispute(disputeId);
    expect(gateway.connect(participant6 as Signer).pickDispute(disputeId)).to.be.revertedWith('max applied agents exceed');
  })
  it("Gateway: allow dispute pick after review deadline ended", async function () {
    escrowDisputableTime = await getCurrentUnixTime() + 10; // now + 30 seconds
    escrowWithdrawableTime = await getCurrentUnixTime() + 120 // now + 2 minutes
    await mtoToken.approve(gateway.address, amount);
    await gateway.purchase(
      productId,
      merchant.address,
      amount,
      escrowDisputableTime,
      escrowWithdrawableTime
    )
    await mtoToken.connect(participant1 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant2 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant3 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant4 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant5 as Signer).approve(gateway.address, amountToWei);
    await mtoToken.connect(participant6 as Signer).approve(gateway.address, amountToWei);


    await gateway.connect(participant1 as Signer).participate();
    await gateway.connect(participant2 as Signer).participate();
    await gateway.connect(participant3 as Signer).participate();
    await gateway.connect(participant4 as Signer).participate();
    await gateway.connect(participant5 as Signer).participate();
    await gateway.connect(participant6 as Signer).participate();

    await new Promise(resolve => setTimeout(resolve, ONE_SECOND));
    await gateway.startDispute(
      disputeId,
    )
    await gateway.connect(participant1 as Signer).pickDispute(disputeId);
    await gateway.connect(participant2 as Signer).pickDispute(disputeId);
    await gateway.connect(participant3 as Signer).pickDispute(disputeId);
    await gateway.connect(participant4 as Signer).pickDispute(disputeId);
    await gateway.connect(participant5 as Signer).pickDispute(disputeId);

    await new Promise(resolve => setTimeout(resolve, TWENTY_MINUTES)); // await after dispute stuck

    await gateway.connect(participant6 as Signer).pickDispute(disputeId);

    expect(true);
    
  })

  it("Gateway: reset dispute Review Group Count", async function () {
    const newDisputeReviewGroupCount = 7;
   
    const tx = await gateway.resetDisputeReviewGroupCount(
      newDisputeReviewGroupCount
    )
    await tx.wait();
    expect((await gateway.disputeReviewGroupCount()).toString()).to.equals(newDisputeReviewGroupCount.toString());
})
});
