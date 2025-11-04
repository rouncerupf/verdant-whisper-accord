// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {
    FHE,
    euint32,
    euint64,
    externalEuint32,
    externalEuint64
} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Verdant Whisper Accord
/// @notice Privacy-preserving initiative approval workflow for environmental organizations.
contract VerdantWhisperAccord is ZamaEthereumConfig {
    enum InitiativeStatus {
        Pending,
        Approved,
        Rejected
    }

    struct Initiative {
        address proposer;
        bytes summaryCiphertext;
        bytes resourcesCiphertext;
        euint64 requestedBudget;
        euint64 allocatedBudget;
        euint32 basePriority;
        euint32 voteTally;
        euint32 detailHandle;
        InitiativeStatus status;
    }

    struct InitiativeSubmission {
        bytes summaryCiphertext;
        bytes resourcesCiphertext;
        externalEuint64 requestedBudgetCipher;
        bytes requestedBudgetProof;
        externalEuint32 basePriorityCipher;
        bytes basePriorityProof;
        externalEuint32 detailHandleCipher;
        bytes detailHandleProof;
    }

    struct AllocationSnapshot {
        euint64 totalRequested;
        euint64 totalAllocated;
        euint64 remaining;
    }

    address public admin;
    Initiative[] private _initiatives;
    mapping(address => bool) public committeeMembers;
    mapping(address => AllocationSnapshot) private _allocationSimulations;
    mapping(address => euint32) private _approvalSimulations;

    euint64 private _globalRequested;
    euint64 private _globalAllocated;
    euint32 private _globalPriority;

    event CommitteeUpdated(address indexed account, bool isActive);
    event InitiativeSubmitted(uint256 indexed id, address indexed proposer);
    event VoteCast(uint256 indexed id, address indexed voter);
    event InitiativeApproved(uint256 indexed id, address indexed approver);
    event DetailHandleAuthorized(uint256 indexed id, address indexed account);
    event DecryptionRequested(uint256 indexed id, address indexed requester);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyCommittee() {
        require(committeeMembers[msg.sender], "Not committee");
        _;
    }

    constructor() {
        admin = msg.sender;
        committeeMembers[msg.sender] = true;

        _globalRequested = FHE.asEuint64(0);
        _globalAllocated = FHE.asEuint64(0);
        _globalPriority = FHE.asEuint32(0);

        FHE.allowThis(_globalRequested);
        FHE.allowThis(_globalAllocated);
        FHE.allowThis(_globalPriority);
        FHE.allow(_globalRequested, admin);
        FHE.allow(_globalAllocated, admin);
        FHE.allow(_globalPriority, admin);
    }

    function initiativeCount() external view returns (uint256) {
        return _initiatives.length;
    }

    function setCommitteeMember(address account, bool enabled) external onlyAdmin {
        committeeMembers[account] = enabled;
        emit CommitteeUpdated(account, enabled);
    }

    function submitInitiative(InitiativeSubmission calldata submission) external returns (uint256) {
        euint64 requestedBudget = FHE.fromExternal(
            submission.requestedBudgetCipher,
            submission.requestedBudgetProof
        );
        euint32 basePriority = FHE.fromExternal(submission.basePriorityCipher, submission.basePriorityProof);
        euint32 detailHandle = FHE.fromExternal(submission.detailHandleCipher, submission.detailHandleProof);

        _initiatives.push();
        uint256 initiativeId = _initiatives.length - 1;
        Initiative storage initiative = _initiatives[initiativeId];
        initiative.proposer = msg.sender;
        initiative.summaryCiphertext = submission.summaryCiphertext;
        initiative.resourcesCiphertext = submission.resourcesCiphertext;
        initiative.requestedBudget = requestedBudget;
        initiative.allocatedBudget = FHE.asEuint64(0);
        initiative.basePriority = basePriority;
        initiative.voteTally = FHE.asEuint32(0);
        initiative.detailHandle = detailHandle;
        initiative.status = InitiativeStatus.Pending;

        _globalRequested = FHE.add(_globalRequested, requestedBudget);
        _globalPriority = FHE.add(_globalPriority, basePriority);

        FHE.allowThis(_globalRequested);
        FHE.allowThis(_globalPriority);
        FHE.allow(_globalRequested, admin);
        FHE.allow(_globalPriority, admin);
        FHE.allow(_globalRequested, msg.sender);
        FHE.allow(_globalPriority, msg.sender);

        FHE.allowThis(requestedBudget);
        FHE.allowThis(basePriority);
        FHE.allowThis(initiative.allocatedBudget);
        FHE.allowThis(initiative.voteTally);
        FHE.allowThis(detailHandle);

        FHE.allow(requestedBudget, msg.sender);
        FHE.allow(basePriority, msg.sender);
        FHE.allow(detailHandle, msg.sender);

        emit InitiativeSubmitted(initiativeId, msg.sender);
        return initiativeId;
    }

    function castVote(
        uint256 initiativeId,
        externalEuint32 voteWeightCipher,
        bytes calldata voteProof
    ) external onlyCommittee {
        require(initiativeId < _initiatives.length, "Invalid initiative");
        Initiative storage initiative = _initiatives[initiativeId];
        require(initiative.status == InitiativeStatus.Pending, "Not pending");

        euint32 voteWeight = FHE.fromExternal(voteWeightCipher, voteProof);
        initiative.voteTally = FHE.add(initiative.voteTally, voteWeight);
        _globalPriority = FHE.add(_globalPriority, voteWeight);

        FHE.allowThis(_globalPriority);
        FHE.allow(_globalPriority, admin);
        FHE.allow(_globalPriority, msg.sender);
        FHE.allow(_globalPriority, initiative.proposer);

        FHE.allowThis(initiative.voteTally);
        FHE.allow(initiative.voteTally, msg.sender);
        FHE.allow(initiative.voteTally, initiative.proposer);

        emit VoteCast(initiativeId, msg.sender);
    }

    function simulateAllocation(
        uint256[] calldata initiativeIds,
        externalEuint64 budgetPoolCipher,
        bytes calldata budgetPoolProof
    ) external onlyCommittee {
        require(initiativeIds.length > 0, "No initiatives");

        euint64 budgetPool = FHE.fromExternal(budgetPoolCipher, budgetPoolProof);
        euint64 totalRequested = FHE.asEuint64(0);
        euint64 totalAllocated = FHE.asEuint64(0);

        for (uint256 i = 0; i < initiativeIds.length; i++) {
            uint256 initiativeId = initiativeIds[i];
            require(initiativeId < _initiatives.length, "Invalid initiative");
            Initiative storage initiative = _initiatives[initiativeId];

            totalRequested = FHE.add(totalRequested, initiative.requestedBudget);
            totalAllocated = FHE.add(totalAllocated, initiative.allocatedBudget);
        }

        AllocationSnapshot storage snapshot = _allocationSimulations[msg.sender];
        snapshot.totalRequested = totalRequested;
        snapshot.totalAllocated = totalAllocated;
        snapshot.remaining = FHE.sub(budgetPool, totalRequested);

        FHE.allowThis(snapshot.totalRequested);
        FHE.allowThis(snapshot.totalAllocated);
        FHE.allowThis(snapshot.remaining);

        FHE.allow(snapshot.totalRequested, msg.sender);
        FHE.allow(snapshot.totalAllocated, msg.sender);
        FHE.allow(snapshot.remaining, msg.sender);
    }

    function simulateApproval(uint256[] calldata initiativeIds) external onlyCommittee {
        require(initiativeIds.length > 0, "No initiatives");

        euint32 combined = FHE.asEuint32(0);

        for (uint256 i = 0; i < initiativeIds.length; i++) {
            uint256 initiativeId = initiativeIds[i];
            require(initiativeId < _initiatives.length, "Invalid initiative");
            Initiative storage initiative = _initiatives[initiativeId];

            euint32 aggregated = FHE.add(initiative.basePriority, initiative.voteTally);
            combined = FHE.add(combined, aggregated);
        }

        _approvalSimulations[msg.sender] = combined;

        FHE.allowThis(combined);
        FHE.allow(combined, msg.sender);
    }

    function approveInitiative(
        uint256 initiativeId,
        externalEuint64 allocationCipher,
        bytes calldata allocationProof
    ) external onlyCommittee {
        require(initiativeId < _initiatives.length, "Invalid initiative");
        Initiative storage initiative = _initiatives[initiativeId];
        require(initiative.status == InitiativeStatus.Pending, "Not pending");

        euint64 allocation = FHE.fromExternal(allocationCipher, allocationProof);
        initiative.allocatedBudget = FHE.add(initiative.allocatedBudget, allocation);
        _globalAllocated = FHE.add(_globalAllocated, allocation);
        initiative.status = InitiativeStatus.Approved;

        FHE.allowThis(_globalAllocated);
        FHE.allow(_globalAllocated, admin);
        FHE.allow(_globalAllocated, msg.sender);
        FHE.allow(_globalAllocated, initiative.proposer);

        FHE.allowThis(initiative.allocatedBudget);
        FHE.allow(initiative.allocatedBudget, msg.sender);
        FHE.allow(initiative.allocatedBudget, initiative.proposer);
        FHE.allow(initiative.detailHandle, initiative.proposer);

        emit InitiativeApproved(initiativeId, msg.sender);
    }

    function requestDecryption(uint256 initiativeId) external {
        require(initiativeId < _initiatives.length, "Invalid initiative");
        Initiative storage initiative = _initiatives[initiativeId];
        require(msg.sender == initiative.proposer, "Only proposer");
        require(initiative.status == InitiativeStatus.Approved, "Not approved");

        emit DecryptionRequested(initiativeId, msg.sender);
    }

    function authorizeDetailHandle(uint256 initiativeId, address account) external onlyCommittee {
        require(initiativeId < _initiatives.length, "Invalid initiative");
        Initiative storage initiative = _initiatives[initiativeId];
        require(initiative.status == InitiativeStatus.Approved, "Not approved");

        FHE.allow(initiative.detailHandle, account);

        emit DetailHandleAuthorized(initiativeId, account);
    }

    function getInitiative(uint256 initiativeId)
        external
        view
        returns (
            address proposer,
            InitiativeStatus status,
            bytes memory summaryCiphertext,
            bytes memory resourcesCiphertext
        )
    {
        require(initiativeId < _initiatives.length, "Invalid initiative");
        Initiative storage initiative = _initiatives[initiativeId];
        return (initiative.proposer, initiative.status, initiative.summaryCiphertext, initiative.resourcesCiphertext);
    }

    function getInitiativeBudgets(uint256 initiativeId)
        external
        view
        returns (euint64 requestedBudget, euint64 allocatedBudget)
    {
        require(initiativeId < _initiatives.length, "Invalid initiative");
        Initiative storage initiative = _initiatives[initiativeId];
        return (initiative.requestedBudget, initiative.allocatedBudget);
    }

    function getInitiativePriority(uint256 initiativeId)
        external
        view
        returns (euint32 basePriority, euint32 voteTally)
    {
        require(initiativeId < _initiatives.length, "Invalid initiative");
        Initiative storage initiative = _initiatives[initiativeId];
        return (initiative.basePriority, initiative.voteTally);
    }

    function getDetailHandle(uint256 initiativeId) external view returns (euint32) {
        require(initiativeId < _initiatives.length, "Invalid initiative");
        return _initiatives[initiativeId].detailHandle;
    }

    function getAllocationSnapshot(address account)
        external
        view
        returns (euint64 totalRequested, euint64 totalAllocated, euint64 remaining)
    {
        AllocationSnapshot storage snapshot = _allocationSimulations[account];
        return (snapshot.totalRequested, snapshot.totalAllocated, snapshot.remaining);
    }

    function getApprovalSimulation(address account) external view returns (euint32) {
        return _approvalSimulations[account];
    }

    function getGlobalTotals()
        external
        view
        returns (euint64 totalRequested, euint64 totalAllocated, euint32 globalPriority)
    {
        return (_globalRequested, _globalAllocated, _globalPriority);
    }
}


