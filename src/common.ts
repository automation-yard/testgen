export const TypescriptExample = `Example TypeScript (NestJs) Test Structure:
\`\`\`typescript
import { PicklistItem } from '@celito.core-apis/src/modules/picklist/entities/picklist-item.entity';
import { Picklist } from '@celito.core-apis/src/modules/picklist/entities/picklist.entity';
import { PicklistItemServiceSymbol } from '@celito.core-apis/src/modules/picklist/interfaces/picklist-item-service.interface';
import { PicklistServiceSymbol } from '@celito.core-apis/src/modules/picklist/interfaces/picklist-service.interface';
import { PicklistItemRepository } from '@celito.core-apis/src/modules/picklist/repositories/picklist-item.repository';
import { PicklistItemService } from '@celito.core-apis/src/modules/picklist/services/picklist-item.service';
import { LoggerService } from '@celito.middleware/logger';
import { OwnerTypeEnum } from '@celito.middleware/shared-models';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

const mockPicklistItemRepository = {
  getPicklistItemByName: jest.fn(),
  softDelete: jest.fn(),
  save: jest.fn(),
  updateById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn()
};
const mockPicklistService = {
  getPicklistByName: jest.fn()
};
describe('picklist-item-service', () => {
  let service: PicklistItemService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PicklistItemServiceSymbol,
          useClass: PicklistItemService
        },
        {
          provide: PicklistItemRepository,
          useValue: mockPicklistItemRepository
        },
        {
          provide: PicklistServiceSymbol,
          useValue: mockPicklistService
        },
        {
          provide: LoggerService,
          useValue: {}
        }
      ]
    }).compile();

    service = module.get<PicklistItemService>(PicklistItemServiceSymbol);
  });

  describe('addNewPicklistItem', () => {
    it('should add a new picklist item', async () => {
      const picklistName = 'MyPicklist';
      const picklistItemEntity = new PicklistItem();

      const existingPicklist = new Picklist();
      existingPicklist.items = [];

      jest.spyOn(mockPicklistService, 'getPicklistByName').mockResolvedValue(existingPicklist);
      jest.spyOn(mockPicklistItemRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(mockPicklistItemRepository, 'save')
        .mockImplementation((picklistItem) => Promise.resolve(picklistItem));

      const result = await service.addNewPicklistItem(picklistName, picklistItemEntity);

      expect(mockPicklistService.getPicklistByName).toHaveBeenCalledWith(picklistName);
      expect(mockPicklistItemRepository.findOne).toHaveBeenCalledWith({
        where: { name: picklistItemEntity.name },
        withDeleted: true
      });
      expect(mockPicklistItemRepository.save).toHaveBeenCalledWith(expect.objectContaining(picklistItemEntity));
      expect(result).toEqual(expect.objectContaining(picklistItemEntity));
    });

    it('should restore a deleted picklist item with the same name', async () => {
      const picklistName = 'MyPicklist';
      const picklistItemName = 'Existing Picklist Item';
      const existingPicklist = new Picklist();
      existingPicklist.items = [];
      existingPicklist.name = picklistItemName;
      existingPicklist.deletedAtUtc = new Date();

      const picklistItemEntity = new PicklistItem();
      picklistItemEntity.name = picklistItemName;

      const restoredPicklistItem = new PicklistItem();

      jest.spyOn(mockPicklistService, 'getPicklistByName').mockResolvedValue(existingPicklist);
      jest.spyOn(mockPicklistItemRepository, 'findOne').mockResolvedValue(existingPicklist);
      jest.spyOn(mockPicklistItemRepository, 'save').mockResolvedValue(restoredPicklistItem);

      const result = await service.addNewPicklistItem(picklistName, picklistItemEntity);
      expect(mockPicklistService.getPicklistByName).toHaveBeenCalledWith(picklistName);
      expect(mockPicklistItemRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: picklistItemName },
          withDeleted: true
        })
      );
      expect(mockPicklistItemRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining(restoredPicklistItem));
    });
    it('should throw BadRequestException if a non-deleted picklist item with the same name exists', async () => {
      const picklistName = 'MyPicklist';
      const existingPicklist = new Picklist();
      existingPicklist.items = [];

      const picklistItemEntity = new PicklistItem();

      jest.spyOn(mockPicklistService, 'getPicklistByName').mockResolvedValue(existingPicklist);
      jest.spyOn(mockPicklistItemRepository, 'findOne').mockReturnValue(existingPicklist);

      await expect(service.addNewPicklistItem(picklistName, picklistItemEntity)).rejects.toThrowError(
        BadRequestException
      );
    });
  });
});
\`\`\``;

export const JavaScriptExample = `Example Javascript (CommonJs) Test Struture
\`\`\`javascript

jest.mock('../../../api/services/FirebaseService', () => {});
jest.mock('../../../api/services/S3Service', () => {});
jest.mock('../../../api/services/SMSService', () => {});
jest.mock('../../../api/services/HelperService');
jest.mock('../../../api/services/FanGemsService', () => ({
  getUserFanGemsInfo: jest.fn(),
  getActiveFanGemsOfUser: jest.fn(),
  isFanGemsApplicableToContest: jest.fn()
}));
jest.mock('../../../api/common/ClientValidatorUtil', () => ({
  default: {
    getB2BClientConfig: jest.fn(),
    isFeatureUnlockedForClient: jest.fn()
  }
}));
jest.mock('../../../api/services/RazorpayService', () => ({
  getRazorpayOrderId: jest.fn()
}));
jest.mock('../../../api/services/BlacklistedUserService', () => ({
  isUserBlacklistedForContests: jest.fn()
}));

jest.mock('../../../api/services/TeamService', () => ({
  getTeamsInfo: jest.fn()
}));

jest.mock('semver', () => ({
  gte: jest.fn(),
  satisfies: jest.fn()
}));

jest.mock('../../../api/common/DiscountUtils', () => ({
  isDiscountEligible: jest.fn()
}));

jest.mock('../../../api/repos/TeamRepo', () => ({
  getTeamInfoInBulk: jest.fn(),
  updateMultipleTeams: jest.fn()
}));
jest.mock('../../../api/repos/SNSRepo', () => ({
  getSNSDetails: jest.fn()
}));
jest.mock('../../../api/services/MailService', () => ({
  sendMail: jest.fn()
}));


// Import the mocked module
const ClientValidatorUtil = require('../../../api/common/ClientValidatorUtil').default;
const BlacklistedUserService = require('../../../api/services/BlacklistedUserService');

// Now import AppUserService after all mocks are in place
const AppUserService = require('../../../api/services/AppUserService');
const HelperService = require('../../../api/services/HelperService');
const ContestRepo = require('../../../api/repos/ContestRepo');
const MatchRepo = require('../../../api/repos/MatchRepo');
const TeamRepo = require('../../../api/repos/TeamRepo');
const FanGemsService = require('../../../api/services/FanGemsService');
const UserTaskService = require('../../../api/services/UserTaskService');
const MailService = require('../../../api/services/MailService');
const DiscountUtils = require('../../../api/common/DiscountUtils');
const InitConfigUtils = require('../../../api/common/utils/InitConfigUtils').default;
const TransactionRepo = require('../../../api/repos/TransactionRepo');
const UserStatsRepo = require('../../../api/repos/UserStatsRepo');
const CommonUtils = require('../../../api/common/CommonUtils');

describe('AppUserService', () => {
  describe('addTeamsToContests', () => {
    const params = { 
      matchId: "match123",
      contests: [],
      discountCode: null, 
      areFanGemsApplied: false,
      createTeamAndJoinFlow: false,
    };
    const user = { id: "user123", clientId: "client123" };
    const clientInfo = { clientId: "client123", appVersion: "1.0.0" };

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('Should allow a user to join multiple contests with a valid discount code', async () => {
      const successParams = {
        ...params,
        areFanGemsApplied: false,
        discountCode: "discount123",
        contests: [{
          contestId: "contest123",
          teams: [{ teamId: "team1" }, { teamId: "team2" }]
        }, {
          contestId: "contest456",
          teams: [{ teamId: "team3" }, { teamId: "team4" }]
        }],
      };
      const successUser = { 
        ...user,
        userStats: { contestsCount: 5 }
      };

      const mockContestsDict = {
        contest123: {
          id: "contest123", entryFeePerTeam: 100, totalSlots: 10,
          category: { name: "CLASSIC" }, match: "match123",
          totalSlotsEntered: 0, name: "Test Contest", status: "available"
        },
        contest456: {
          id: "contest456", entryFeePerTeam: 100, totalSlots: 10,
          category: { name: "CLASSIC" }, match: "match123",
          totalSlotsEntered: 0, name: "Test Contest", status: "available"
        }
      };
      const mockMatchDetail = {
        clientId: "client123", status: "upcoming",
        startTime: new Date(Date.now() + 86400000).toISOString(),
        game: "CRICKET",
      };

      jest.spyOn(HelperService, 'getConnectionFromPool').mockResolvedValue({
        dbConnection: {
          db: jest.fn().mockReturnValue({
            collection: jest.fn().mockReturnValue({
              bulkWrite: jest.fn().mockResolvedValue({})
            })
          })
        },
        session: {}
      });
      jest.spyOn(ClientValidatorUtil, 'getB2BClientConfig').mockResolvedValue({});
      jest.spyOn(ClientValidatorUtil, 'isFeatureUnlockedForClient').mockReturnValue(true);
      jest.spyOn(MatchRepo, 'getMatch').mockResolvedValue(mockMatchDetail);
      jest.spyOn(BlacklistedUserService, 'isUserBlacklistedForContests').mockResolvedValue(false);
      jest.spyOn(ContestRepo, 'getContestsById').mockResolvedValue(mockContestsDict);
      jest.spyOn(ContestRepo, 'updateAndGetSlotNumber').mockResolvedValue(3);
      jest.spyOn(ContestRepo, 'getUserParticipationForMultipleContests').mockResolvedValue([]);
      jest.spyOn(TeamRepo, 'getTeamInfoInBulk').mockResolvedValue([
        { _id: "team1", match: "match123", user: "user123" },
        { _id: "team2", match: "match123", user: "user123" },
        { _id: "team3", match: "match123", user: "user123" },
        { _id: "team4", match: "match123", user: "user123" }
      ]);
      jest.spyOn(FanGemsService, 'getUserFanGemsInfo').mockResolvedValue({});
      jest.spyOn(FanGemsService, 'getActiveFanGemsOfUser').mockResolvedValue([]);
      jest.spyOn(UserTaskService, 'getDailyStreakTaskAndProgress').mockResolvedValue({
        dailyStreakTask: {
          progressTriggers: [{ trigger: "general_dailyStreak", constraint: { contestTypes: ["CRICKET"] } }]
        }
      });
      jest.spyOn(AppUserService, 'asyncCallsParticipation').mockImplementation(() => {});
      jest.spyOn(FanGemsService, 'isFanGemsApplicableToContest').mockResolvedValue(true);
      jest.spyOn(InitConfigUtils, 'getBottomNavSection').mockReturnValue([]);
      jest.spyOn(AppUserService, 'performCheckout').mockResolvedValue({
        userWalletBalance: { cashBalance: 900, totalWinnings: 1000 },
        contestParticipationIds: ['participation1', 'participation2']
      });
      
      const result = await AppUserService.addTeamsToContests(successParams, successUser, clientInfo);
      expect(result).toBeDefined();
      expect(result.status).toBe("success");
      expect(result.wallet).toEqual({ cashBalance: 900, totalWinnings: 1000 });
      expect(ContestRepo.updateAndGetSlotNumber).toHaveBeenCalledTimes(2);
      expect(AppUserService.performCheckout).toHaveBeenCalled();
      expect(AppUserService.asyncCallsParticipation).toHaveBeenCalled();
    });
    

    it('Should prevent a user from joining a contest when exceeding the maximum teams per user limit', async () => {
      const maxTeamsParams = {
        ...params,
        contests: [{
          contestId: "contest123",
          teams: [{ teamId: "team1" }, { teamId: "team2" }, { teamId: "team3" }]
        }]
      };
      const maxTeamsUser = { 
        ...user,
        userStats: { contestsCount: 5 }
      };
    
      const mockMatchDetail = {
        clientId: "client123", status: "upcoming",
        startTime: new Date(Date.now() + 86400000).toISOString(),
        game: "CRICKET",
      };
    
      const mockContestsDict = {
        contest123: {
          id: "contest123", entryFeePerTeam: 100, totalSlots: 10,
          category: { name: "CLASSIC" }, match: "match123",
          totalSlotsEntered: 0, name: "Test Contest", status: "available",
          maxTeamsPerUser: 2 // Set the maximum teams per user to 2
        }
      };
    
      jest.spyOn(HelperService, 'getConnectionFromPool').mockResolvedValue({
        dbConnection: {
          db: jest.fn().mockReturnValue({
            collection: jest.fn().mockReturnValue({
              bulkWrite: jest.fn().mockResolvedValue({})
            })
          })
        },
        session: {}
      });
      jest.spyOn(ClientValidatorUtil, 'getB2BClientConfig').mockResolvedValue({});
      jest.spyOn(ClientValidatorUtil, 'isFeatureUnlockedForClient').mockReturnValue(true);
      jest.spyOn(MatchRepo, 'getMatch').mockResolvedValue(mockMatchDetail);
      jest.spyOn(BlacklistedUserService, 'isUserBlacklistedForContests').mockResolvedValue(false);
      jest.spyOn(ContestRepo, 'getContestsById').mockResolvedValue(mockContestsDict);
      jest.spyOn(ContestRepo, 'updateAndGetSlotNumber').mockResolvedValue(3);
      jest.spyOn(ContestRepo, 'getUserParticipationForMultipleContests').mockResolvedValue([
        { contest: "contest123", team: "existingTeam1" },
        { contest: "contest123", team: "existingTeam2" }
      ]);
      jest.spyOn(TeamRepo, 'getTeamInfoInBulk').mockResolvedValue([
        { _id: "team1", match: "match123", user: maxTeamsUser.id },
        { _id: "team2", match: "match123", user: maxTeamsUser.id },
        { _id: "team3", match: "match123", user: maxTeamsUser.id }
      ]);
    
      await expect(AppUserService.addTeamsToContests(maxTeamsParams, maxTeamsUser, clientInfo))
        .rejects.toThrow('Number of teams exceeds allowed limit per user in this contest Test Contest.');
    
      expect(ContestRepo.getUserParticipationForMultipleContests).toHaveBeenCalledWith(
        ["contest123"], maxTeamsUser.id, ["team", "contest"], expect.anything()
      );
    });
  });
});
\`\`\``;