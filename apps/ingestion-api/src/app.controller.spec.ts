import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHello', () => {
    it('should return root endpoint response', async () => {
      const expectedResponse = 'Database connected! Result: [{"test":1}]';
      const getHelloSpy = jest
        .spyOn(service, 'getHello')
        .mockResolvedValue(expectedResponse);

      const result = await controller.getHello();

      expect(getHelloSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedResponse);
    });
  });
});
