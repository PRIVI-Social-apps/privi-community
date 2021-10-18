const ERC20TokenExchange = artifacts.require("ERC20TokenExchange");
const IncreasingPriceERC721Auction = artifacts.require("IncreasingPriceERC721Auction");
const PRIVIERC20TestToken = artifacts.require("PRIVIERC20TestToken");
const PRIVIOfferTestToken = artifacts.require("PRIVIOfferTestToken");

const PRIVIDAO = artifacts.require("PRIVIDAO");
const ManageCommunityToken = artifacts.require("ManageCommunityToken");
const CommunityEjectMember = artifacts.require("CommunityEjectMember");
const CommunityTreasurer = artifacts.require("CommunityTreasurer");

const {
    BN,           // Big Number support
    time,
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');

const { ZERO_ADDRESS } = constants;


contract("CommunityTreasurer", (accounts) => {
    var erc20tokenexchange_contract;
    var increasingpriceerc721auction_contract;
    var privierc20testtoken_contract;
    var offertoken_contract;

    var prividao_contract;
    var managecommunitytoken_contract;
    var communityejectmember_contract;
    var communitytreasurer_contract;

    before(async () => {
        erc20tokenexchange_contract = await ERC20TokenExchange.new(
            { from: accounts[0] }
        ); 

        increasingpriceerc721auction_contract = await IncreasingPriceERC721Auction.new(
            { from: accounts[0] }
        );

        privierc20testtoken_contract = await PRIVIERC20TestToken.new(
            { from: accounts[0] }
        );

        offertoken_contract = await PRIVIOfferTestToken.new(
            { from: accounts[0] }
        );

        prividao_contract = await PRIVIDAO.new(
            erc20tokenexchange_contract.address,
            increasingpriceerc721auction_contract.address,
            { from: accounts[0] }
        );

        managecommunitytoken_contract = await ManageCommunityToken.new(
            prividao_contract.address,
            { from: accounts[0] }
        );

        await prividao_contract.setManageCommunityTokenContractAddress(managecommunitytoken_contract.address);

        communityejectmember_contract = await CommunityEjectMember.new(
            prividao_contract.address,
            managecommunitytoken_contract.address,
            { from: accounts[0] }
        );

        communitytreasurer_contract = await CommunityTreasurer.new(
            prividao_contract.address,
            communityejectmember_contract.address,
            { from: accounts[0] }
        );

        await prividao_contract.setEjectMemberContractAddress(communityejectmember_contract.address);

        await managecommunitytoken_contract.registerToken("USD Coin", "USDC", privierc20testtoken_contract.address);
        await managecommunitytoken_contract.registerToken("Uniswap", "UNI", privierc20testtoken_contract.address);

        const founders = [accounts[0], accounts[1], accounts[2]];
        const foundersShares = [5000, 3000, 2000];
        const foundersCount = 3;
        const entryType = "Staking";
        const entryConditionSymbols = ["USDC", "UNI"];
        const entryConditionValues = [10000, 5000];
        const entryConditionCount = 2;
        const foundersVotingTime = 11111111111;
        const foundersConsensus = 9000;
        const treasuryVotingTime = 11111111111;
        const treasuryConsensus = 9000;
        const escrowAddress = accounts[9];
        const stakingAddress = accounts[8];
        const communityAddress = accounts[7];
        const date = await time.latest();
        const tokenId = 0;

        //Create Community

        await prividao_contract.CreateCommunity({
            founders: founders,
            foundersShares: foundersShares,
            foundersCount: foundersCount,
            entryType: entryType,
            entryConditionSymbols: entryConditionSymbols,
            entryConditionValues: entryConditionValues,
            entryConditionCount: entryConditionCount,
            foundersVotingTime: foundersVotingTime,
            foundersConsensus: foundersConsensus,
            treasuryVotingTime: treasuryVotingTime,
            treasuryConsensus: treasuryConsensus,
            escrowAddress: escrowAddress,
            stakingAddress: stakingAddress,
            communityAddress: communityAddress,
            date: date,
            tokenId: tokenId,
        }, { from: accounts[0] });

        const communityCPId = await prividao_contract.getCommunityCPIdByIndex(0);
        const communityCP = await prividao_contract.getCreationProposal(communityCPId.toString());

        await prividao_contract.VoteCreationProposal({
            proposalId: communityCP.proposalId,
            communityId: communityCP.proposal.communityAddress,
            decision: true
        }, { from: accounts[0] });

        await prividao_contract.VoteCreationProposal({
            proposalId: communityCP.proposalId,
            communityId: communityCP.proposal.communityAddress,
            decision: true
        }, { from: accounts[1] });

        await prividao_contract.VoteCreationProposal({
            proposalId: communityCP.proposalId,
            communityId: communityCP.proposal.communityAddress,
            decision: true
        }, { from: accounts[2] });

        await privierc20testtoken_contract.mint(communityAddress, 10000000);
        await privierc20testtoken_contract.mint(escrowAddress, 10000000);
        await privierc20testtoken_contract.mint(stakingAddress, 10000000);
        await privierc20testtoken_contract.mint(accounts[0], 10000000);

        await offertoken_contract.mint(communityAddress, 10000000);
        await offertoken_contract.mint(escrowAddress, 10000000);

        // Create CommunityToken
        const communityId = await prividao_contract.getCommunityIdByIndex(0);
        const tokenName = "PRIVIERC20TestToken";
        const tokenSymbol = "PRIVIERC20Test";
        const tokenContractAddress = privierc20testtoken_contract.address;
        const fundingToken = "USDC";
        const ammAddress = accounts[6];
        const tokenType = "LINEAR";
        const initialSupply = 100000000;
        const targetPrice = 3;
        const targetSupply = 300000000;
        const vestingTime = 30*24*60*60;
        const immediateAllocationPct = 10;
        const vestedAllocationPct = 10;
        const taxationPct = 10;
        const airdropAmount = 1000000;
        const allocationAmount = 70000000;

        await managecommunitytoken_contract.CreateCommunityToken({
            tokenId: tokenId,
            communityId: communityId,
            tokenName: tokenName,
            tokenSymbol: tokenSymbol,
            tokenContractAddress: tokenContractAddress,
            fundingToken: fundingToken,
            ammAddress: ammAddress,
            tokenType: tokenType,
            initialSupply: initialSupply,
            targetPrice: targetPrice,
            targetSupply: targetSupply,
            vestingTime: vestingTime,
            immediateAllocationPct: immediateAllocationPct,
            vestedAllocationPct: vestedAllocationPct,
            taxationPct: taxationPct,
            date: date,
            airdropAmount: airdropAmount,
            allocationAmount: allocationAmount
        }, { from: accounts[0] })

        const communityTPId = await managecommunitytoken_contract.getCommunityTPIdByIndex(0);
        const communityTP = await managecommunitytoken_contract.getCommunityTokenProposal(communityTPId.toString());

        await managecommunitytoken_contract.VoteCommunityTokenProposal({
            proposalId: communityTP.proposalId,
            communityId: communityTP.proposal.communityId,
            decision: true
        }, { from: accounts[0] });

        await managecommunitytoken_contract.VoteCommunityTokenProposal({
            proposalId: communityTP.proposalId,
            communityId: communityTP.proposal.communityId,
            decision: true
        }, { from: accounts[1] });

        await managecommunitytoken_contract.VoteCommunityTokenProposal({
            proposalId: communityTP.proposalId,
            communityId: communityTP.proposal.communityId,
            decision: true
        }, { from: accounts[2] });
    })

    describe("CreateTreasurerProposal", () => {
        it("not working if address invalid", async () => {
            const proposalId = 0;
            const communityId = await prividao_contract.getCommunityIdByIndex(0);
            const proposalCreator = accounts[0];
            const approvals = [{IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}];
            const treasurerAddresses = [accounts[4], ZERO_ADDRESS];
            const treasurerCount = 2;
            const isAddingTreasurers = true;
            const date = await time.latest();

            try {
                await communitytreasurer_contract.CreateTreasurerProposal({
                    proposalId: proposalId,
                    communityId: communityId,
                    proposalCreator: proposalCreator,
                    approvals: approvals,
                    treasurerAddresses: treasurerAddresses,
                    treasurerCount: treasurerCount,
                    isAddingTreasurers: isAddingTreasurers,
                    date: date
                }, { from: accounts[0] })
            } catch(error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "address invalid")
        })

        it("not working if remove treasurers as no treasurers are registered", async () => {
            const proposalId = 0;
            const communityId = await prividao_contract.getCommunityIdByIndex(0);
            const proposalCreator = accounts[0];
            const approvals = [{IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}];
            const treasurerAddresses = [accounts[4], accounts[5]];
            const treasurerCount = 2;
            const isAddingTreasurers = false;
            const date = await time.latest();

            try {
                await communitytreasurer_contract.CreateTreasurerProposal({
                    proposalId: proposalId,
                    communityId: communityId,
                    proposalCreator: proposalCreator,
                    approvals: approvals,
                    treasurerAddresses: treasurerAddresses,
                    treasurerCount: treasurerCount,
                    isAddingTreasurers: isAddingTreasurers,
                    date: date
                }, { from: accounts[6] })
            } catch(error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "cannot remove treasurers as no treasurers are registered")
        })

        it("not working if remove treasurers as no treasurers are registered", async () => {
            const proposalId = 0;
            const communityId = await prividao_contract.getCommunityIdByIndex(0);
            const proposalCreator = accounts[0];
            const approvals = [{IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}];
            const treasurerAddresses = [accounts[4], accounts[5]];
            const treasurerCount = 2;
            const isAddingTreasurers = false;
            const date = await time.latest();

            try {
                await communitytreasurer_contract.CreateTreasurerProposal({
                    proposalId: proposalId,
                    communityId: communityId,
                    proposalCreator: proposalCreator,
                    approvals: approvals,
                    treasurerAddresses: treasurerAddresses,
                    treasurerCount: treasurerCount,
                    isAddingTreasurers: isAddingTreasurers,
                    date: date
                }, { from: accounts[6] })
            } catch(error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "cannot remove treasurers as no treasurers are registered")
        })

        it("not working if not founder", async () => {
            const proposalId = 0;
            const communityId = await prividao_contract.getCommunityIdByIndex(0);
            const proposalCreator = accounts[0];
            const approvals = [{IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}];
            const treasurerAddresses = [accounts[4], accounts[5]];
            const treasurerCount = 2;
            const isAddingTreasurers = true;
            const date = await time.latest();

            try {
                await communitytreasurer_contract.CreateTreasurerProposal({
                    proposalId: proposalId,
                    communityId: communityId,
                    proposalCreator: proposalCreator,
                    approvals: approvals,
                    treasurerAddresses: treasurerAddresses,
                    treasurerCount: treasurerCount,
                    isAddingTreasurers: isAddingTreasurers,
                    date: date
                }, { from: accounts[6] })
            } catch(error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "should be founder")
        })

        it("works well", async () => {
            const proposalId = 0;
            const communityId = await prividao_contract.getCommunityIdByIndex(0);
            const proposalCreator = accounts[0];
            const approvals = [{IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}];
            const treasurerAddresses = [accounts[4], accounts[5]];
            const treasurerCount = 2;
            const isAddingTreasurers = true;
            const date = await time.latest();

            const prevCount = await communitytreasurer_contract.getTreasurerProposalCount();

            await communitytreasurer_contract.CreateTreasurerProposal({
                proposalId: proposalId,
                communityId: communityId,
                proposalCreator: proposalCreator,
                approvals: approvals,
                treasurerAddresses: treasurerAddresses,
                treasurerCount: treasurerCount,
                isAddingTreasurers: isAddingTreasurers,
                date: date
            }, { from: accounts[0] })

            const count = await communitytreasurer_contract.getTreasurerProposalCount();
            assert.equal(count.sub(prevCount).toNumber(), 1);
        })
    })

    describe("VoteTreasurerProposal", () => {
        it("not working if not founder", async () => {
            const treasurerProposalId = await communitytreasurer_contract.getTreasurerProposalIds(0);
            const treasurerProposal = await communitytreasurer_contract.getTreasurerProposal(treasurerProposalId.toString());
            
            try {
                await communitytreasurer_contract.VoteTreasurerProposal({
                    proposalId: treasurerProposal.proposalId,
                    communityId: treasurerProposal.communityId,
                    decision: true
                }, { from: accounts[6] });
            } catch(error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "voter has to be an founder of the community");
        })

        it("not working if vote second time", async () => {
            const treasurerProposalId = await communitytreasurer_contract.getTreasurerProposalIds(0);
            const treasurerProposal = await communitytreasurer_contract.getTreasurerProposal(treasurerProposalId.toString());
            
            await communitytreasurer_contract.VoteTreasurerProposal({
                proposalId: treasurerProposal.proposalId,
                communityId: treasurerProposal.communityId,
                decision: true
            }, { from: accounts[0] });

            try {
                await communitytreasurer_contract.VoteTreasurerProposal({
                    proposalId: treasurerProposal.proposalId,
                    communityId: treasurerProposal.communityId,
                    decision: true
                }, { from: accounts[0] });
            } catch(error) {
                thrownError = error;
            }
            assert.include(thrownError.message, "voter can not vote second time");
        })

        it("works well", async () => {
            const treasurerProposalId = await communitytreasurer_contract.getTreasurerProposalIds(0);
            const treasurerProposal = await communitytreasurer_contract.getTreasurerProposal(treasurerProposalId.toString());

            await communitytreasurer_contract.VoteTreasurerProposal({
                proposalId: treasurerProposal.proposalId,
                communityId: treasurerProposal.communityId,
                decision: true
            }, { from: accounts[1] });

            await communitytreasurer_contract.VoteTreasurerProposal({
                proposalId: treasurerProposal.proposalId,
                communityId: treasurerProposal.communityId,
                decision: true
            }, { from: accounts[2] });

            const communityId = await prividao_contract.getCommunityIdByIndex(0);
            const res = await communityejectmember_contract.getMembersByType(communityId, "treasurer");
            assert.equal(res['1'].toNumber(), 2);
        })
    })

    describe("cancelTreasurerProposal", () => {
        it("works well", async () => {
            const proposalId = 0;
            const communityId = await prividao_contract.getCommunityIdByIndex(0);
            const proposalCreator = accounts[0];
            const approvals = [{IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false},
                {IsVoted: false, Vote:false}, {IsVoted: false, Vote:false}];
            const treasurerAddresses = [accounts[6]];
            const treasurerCount = 1;
            const isAddingTreasurers = true;
            const date = await time.latest();

            await communitytreasurer_contract.CreateTreasurerProposal({
                proposalId: proposalId,
                communityId: communityId,
                proposalCreator: proposalCreator,
                approvals: approvals,
                treasurerAddresses: treasurerAddresses,
                treasurerCount: treasurerCount,
                isAddingTreasurers: isAddingTreasurers,
                date: date
            }, { from: accounts[0] })

            const treasurerProposalId = await communitytreasurer_contract.getTreasurerProposalIds(1);
            const treasurerProposal = await communitytreasurer_contract.getTreasurerProposal(treasurerProposalId.toString());

            await communitytreasurer_contract.cancelTreasurerProposal({
                proposalId: treasurerProposal.proposalId,
                communityId: treasurerProposal.communityId,
            }, { from: accounts[0] });

        })
    })
})