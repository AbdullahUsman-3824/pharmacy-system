import { Test, TestingModule } from '@nestjs/testing';
import { DistributorController } from './distributors.controller';
import { DistributorService } from './distributors.service';

describe('DistributorController', () => {
  let controller: DistributorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DistributorController],
      providers: [DistributorService],
    }).compile();

    controller = module.get<DistributorController>(DistributorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
