const { expect } = require('chai');

describe('Community Dispute Management test cases', () => {

    describe('Escrow Test Cases', () => {

        //Will be called before each test
        beforeEach(async () => {

            // Getting contract using required contract name
            TestContract = await ethers.getContractFactory('TestContract');

            // @dev Deploying the contract on default hardhat development network
            // 'instance' will be our interface to communicate with contract
            instance = await TestContract.deploy();

            // Getting the accounts for performing transactions
            // Default deployment account is linked with first account, 'BOB' in our case
            [BOB, ALICE] = await ethers.getSigners();
        })

        it('Refunding from escrow (Buyer)', async () => {

            // Checking initial blanaces
            expect(await instance.balanceOf(BOB.address)).equal(0);
            expect(await instance.balanceOf(instance.address)).equal(0);

            // Minting tokens for testing
            await instance.mint1000MTO();
            expect(await instance.balanceOf(BOB.address)).equal(1000);

            // Performing a testing purchase
            await instance.testPurchase(BOB.address, ALICE.address, 51, 86400, 8640, 0, 112021);

            // Checking blanaces
            expect(await instance.balanceOf(BOB.address)).equal(949);
            expect(await instance.balanceOf(instance.address)).equal(51);

            // Getting the test purchase id
            let id = await instance.getTestID();

            // Setting test refund to check withdrawl
            await instance.setTestStatusRefund(id);

            // Buyer getting refund
            await instance.withdraw(id);

            // Checking the tokens amount to be refund
            expect(await instance.balanceOf(BOB.address)).equal(1000);
            expect(await instance.balanceOf(instance.address)).equal(0);
        })

        it('Withdrawing from escrow (Merchant)', async () => {

            // Checking initial blanaces
            expect(await instance.balanceOf(ALICE.address)).equal(0);
            expect(await instance.balanceOf(instance.address)).equal(0);

            // Minting tokens for testing
            await instance.mint1000MTO();
            expect(await instance.balanceOf(BOB.address)).equal(1000);

            // Performing a testing purchase
            await instance.testPurchase(BOB.address, ALICE.address, 51, 86400, 8640, 0, 112021);

            // Checking blanaces
            expect(await instance.balanceOf(instance.address)).equal(51);

            // Getting the test purchase id
            let id = await instance.getTestID();

            // Buyer getting refund
            await instance.connect(ALICE).withdraw(id);

            // Checking the tokens amount to be refund
            expect(await instance.balanceOf(ALICE.address)).equal(51);
            expect(await instance.balanceOf(instance.address)).equal(0);
        })
    })

    describe('Agent Test Cases', () => {

        //Will be called before each test
        beforeEach(async () => {

            // Getting contract using required contract name
            TestContract = await ethers.getContractFactory('TestContract');

            // @dev Deploying the contract on default hardhat development network
            // 'instance' will be our interface to communicate with contract
            instance = await TestContract.deploy();

            // Getting the accounts for performing transactions
            // Default deployment account is linked with first account, 'BOB' in our case
            [BOB, ALICE] = await ethers.getSigners();
        })

        it('Agent should be able to participate', async () => {

            // Adding a test agent, 'BOB'
            await instance.addAgent();

            // Test deposit token
            await instance.depositEvent(30);

            // Checking the participation of agent with the provided and emitted value
            await expect(await instance.participate(50)).to.emit(instance, 'Participate').withArgs(BOB.address, 50);
        })

        it('Agent should not be able to participate', async () => {

            // Adding a test agent, 'BOB'
            await instance.addAgent();

            // Test deposit token
            await instance.depositEvent(30);

            try {
                // Checking the participation of agent with the provided and emitted value, (WRONG PARTICIAPTION AMOUNT)
                await expect(await instance.participate(40)).to.emit(instance, 'Participate').withArgs(BOB.address, 50);
            }
            catch {
                // Expected error here, so returning
                return;
            }

            // Explicit error for checking
            expect(true).to.equal(false, "Agent is able to participate");
        })

        it('Agent able to submit decision on dispute (APPROVED)', async () => {

            // Adding a test agent, 'ALICE'
            await instance.connect(ALICE).addAgent();
            // Test deposit token, so agent in waiting
            await instance.connect(ALICE).depositEvent(30);

            // Minting tokens for testing
            await instance.mint1000MTO();
            // Performing a testing purchase
            await instance.testPurchase(BOB.address, ALICE.address, 51, 86400, await instance.getBlocktime() + 86400, 0, 112021);

            // Getting the test purchase id
            let eid = await instance.getTestID();
            // Creating disputing, BOB
            await instance.testDispute(eid, 0, 0, 0, 86400, 8640);

            // Getting the test dispute id
            let did = await instance.getTestID();
            // Admin assigning agent to dispute (BOB Admin)
            await instance.assign(did, ALICE.address);

            // Approved the dispute, 3
            await instance.connect(ALICE).submit(did, 3);
        })

        it('Agent able to submit decision on dispute (DISAPPROVED)', async () => {

            // Adding a test agent, 'ALICE'
            await instance.connect(ALICE).addAgent();
            // Test deposit token, so agent in waiting
            await instance.connect(ALICE).depositEvent(30);

            // Minting tokens for testing
            await instance.mint1000MTO();
            // Performing a testing purchase
            await instance.testPurchase(BOB.address, ALICE.address, 51, 86400, await instance.getBlocktime() + 86400, 0, 112021);

            // Getting the test purchase id
            let eid = await instance.getTestID();
            // Creating disputing, BOB
            await instance.testDispute(eid, 0, 0, 0, 86400, 8640);

            // Getting the test dispute id
            let did = await instance.getTestID();
            // Admin assigning agent to dispute (BOB Admin)
            await instance.assign(did, ALICE.address);

            // Approved the dispute, 3
            await instance.connect(ALICE).submit(did, 4);
        })

        it('Depositing bonus in contract by Admin', async () => {

            // Minting tokens for testing
            await instance.mint1000MTO();

            // Admin depositing bonus tokens in contract so agents can withdraw their bonuses
            await instance.bonusDeposit(100);

            // Checking the deposited bonus tokens
            expect(await instance.balanceOf(instance.address)).equal(100);
        })

        it('Agent withdrawing bonus from contract', async () => {

            // Adding a test agent, 'ALICE'
            await instance.connect(ALICE).addAgent();
            // Test deposit token, so agent in waiting
            await instance.connect(ALICE).depositEvent(30);

            // Minting tokens for testing
            await instance.mint1000MTO();
            // Performing a testing purchase
            await instance.testPurchase(BOB.address, ALICE.address, 51, 86400, await instance.getBlocktime() + 86400, 0, 112021);

            // Getting the test purchase id
            let eid = await instance.getTestID();
            // Creating disputing, BOB
            await instance.testDispute(eid, 0, 0, 0, 86400, 8640);

            // Getting the test dispute id
            let did = await instance.getTestID();
            // Admin assigning agent to dispute (BOB Admin)
            await instance.assign(did, ALICE.address);

            // Approved the dispute, 3
            await instance.connect(ALICE).submit(did, 3);

            // Admin depositing bonus tokens in contract so agents can withdraw their bonuses
            await instance.bonusDeposit(100);

            // Agent withdrawing its stored bonus tokens from contract
            await instance.connect(ALICE).withdrawB();

            // Checking the bonus withdrawed account balance
            expect(await instance.balanceOf(ALICE.address)).equal(20);
        })
    })

    describe('Dispute Test Cases', () => {

        //Will be called before each test
        beforeEach(async () => {

            // Getting contract using required contract name
            TestContract = await ethers.getContractFactory('TestContract');

            // @dev Deploying the contract on default hardhat development network
            // 'instance' will be our interface to communicate with contract
            instance = await TestContract.deploy();

            // Getting the accounts for performing transactions
            // Default deployment account is linked with first account, 'BOB' in our case
            [BOB, ALICE] = await ethers.getSigners();
        })

        it('Dispute produced by buyer', async () => {

            // Minting tokens for testing
            await instance.mint1000MTO();

            // Performing a testing purchase
            await instance.testPurchase(BOB.address, ALICE.address, 51, 86400, await instance.getBlocktime() + 86400, 0, 112021);

            // Getting the test purchase id
            let _id = await instance.getTestID();

            // Creating disputing, BOB
            await instance.dispute(_id, 0, 0, 0, 86400, 8640);
        })
    })

    describe('Admin Test Cases', () => {

        //Will be called before each test
        beforeEach(async () => {

            // Getting contract using required contract name
            TestContract = await ethers.getContractFactory('TestContract');

            // @dev Deploying the contract on default hardhat development network
            // 'instance' will be our interface to communicate with contract
            instance = await TestContract.deploy();

            // Getting the accounts for performing transactions
            // Default deployment account is linked with first account, 'BOB' in our case
            [BOB, ALICE] = await ethers.getSigners();
        })

        it('Admin assigning agents', async () => {

            // Minting tokens for testing
            await instance.mint1000MTO();

            // Performing a testing purchase
            await instance.testPurchase(BOB.address, ALICE.address, 51, 86400, await instance.getBlocktime() + 86400, 0, 112021);

            // Getting the test purchase id
            let eid = await instance.getTestID();

            // Creating disputing, BOB
            await instance.testDispute(eid, 0, 0, 0, 86400, 8645);

            // Getting the test dispite id
            let did = await instance.getTestID();

            // Adding a test agent, 'BOB'
            await instance.connect(ALICE).addAgent();

            // Test deposit token, so agent in waiting
            await instance.connect(ALICE).depositEvent(30);

            // Admin assigning agent to dispute (BOB Admin)
            await instance.assign(did, ALICE.address);
        })

        it('Non admin should not be able assign', async () => {

            // Minting tokens for testing
            await instance.mint1000MTO();

            // Performing a testing purchase
            await instance.testPurchase(BOB.address, ALICE.address, 51, 86400, await instance.getBlocktime() + 86400, 0, 112021);

            // Getting the test purchase id
            let eid = await instance.getTestID();

            // Creating disputing, BOB
            await instance.testDispute(eid, 0, 0, 0, 86400, 8645);

            // Getting the test dispite id
            let did = await instance.getTestID();

            // Adding a test agent, 'BOB'
            await instance.connect(ALICE).addAgent();
            // Test deposit token, so agent in waiting
            await instance.connect(ALICE).depositEvent(30);

            // Admin assigning agent to dispute (ALICE not Admin)
            try {
                await instance.connect(ALICE).assign(did, ALICE.address);
            } catch {
                // As Alice not admin so should return from here
                return;
            }

            // Explicit error generation if desired flow dosent work
            expect(true).to.equal(false);
        })
    })
})
