export const typescriptExample = `Example TypeScript (NestJs) Test Structure:
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
