import {
  getAddDelegatorParams,
  getUnsignedAddDelegator,
  addDelegator
} from '../../src/addDelegator';
import { contextEnv } from '../../src/constants';
import { Context } from '../../src/interfaces';
import fixtures from '../fixtures/addDelegate.data';
<<<<<<< HEAD
import { tranferFundsFromCtoP } from '../helper/testHelpers';
=======

>>>>>>> a69986ab47e55ac44bf11b244ad9d42cba5d1c5e
describe('addDelegate Testcases', () => {
  describe('getAddDelegatorParams Testcases [.env]', () => {
    let ctx: Context = contextEnv('.env', 'localflare');
    test('Should get params for valid Input', async () => {
      try {
        const inputObject = fixtures.getAddDelegatorParams.input;
        // console.log(ctx)
        const params = await getAddDelegatorParams(
          ctx,
          inputObject.nodeID,
          inputObject.stakeAmount,
          inputObject.startTime,
          inputObject.endTime
        );
        expect(params).not.toBeNull;
      } catch (error) {
        expect(error).toBeNull;
      }
    });
  });

  describe('getUnsignedAddDelegator Testcases [.env]', () => {
    test('Should throw error for stake amount less than 25000000000', async () => {
      let ctx: Context = contextEnv('.env', 'localflare');
      const inputObject = fixtures.getUnsignedAddDelegator.invalidStake;

      await expect(() =>
        getUnsignedAddDelegator(
          ctx,
          inputObject.nodeID,
          inputObject.stakeAmount,
          inputObject.startTime,
          inputObject.endTime
        )
      ).rejects.toThrow(
        'PlatformVMAPI.buildAddDelegatorTx -- stake amount must be at least 25000000000'
      );
    });

    test('Should throw error for invalid start time', async () => {
      let ctx: Context = contextEnv('.env', 'localflare');
      const inputObject = fixtures.getUnsignedAddDelegator.invalidStartTime;

      await expect(() =>
        getUnsignedAddDelegator(
          ctx,
          inputObject.nodeID,
          inputObject.stakeAmount,
          inputObject.startTime,
          inputObject.endTime
        )
      ).rejects.toThrow(
        'PlatformVMAPI.buildAddDelegatorTx -- startTime must be in the future and endTime must come after startTime'
      );
    });

    test('Should throw error for insuffient balance', async () => {
      let ctx: Context = contextEnv('.env', 'localflare');
      const inputObject = fixtures.getUnsignedAddDelegator.insufficientBalance;

      await expect(() =>
        getUnsignedAddDelegator(
          ctx,
          inputObject.nodeID,
          inputObject.stakeAmount,
          inputObject.startTime,
          inputObject.endTime
        )
      ).rejects.toThrow(
        'Error - UTXOSet.getMinimumSpendable: insufficient funds to create the transaction'
      );
    });

    test('Should return unsigned trx', async () => {
      const inputObject = fixtures.getUnsignedAddDelegator.insufficientBalance;
      let ctx: Context = contextEnv('.env', 'localflare');
      const utils = require('../../src/utils');
      const spy = jest.spyOn(utils, 'serializeUnsignedTx');
      spy.mockReturnValue('abcd');
      ctx.pchain.buildAddDelegatorTx = jest.fn();
      //@ts-ignore
      const mockUnsignedTx: UnsignedTx = {
        prepareUnsignedHashes: jest.fn(),
        toBuffer: jest.fn()
      };
      //@ts-ignore
      ctx.pchain.buildAddDelegatorTx.mockResolvedValue(mockUnsignedTx);
      //@ts-ignore
      mockUnsignedTx.prepareUnsignedHashes.mockReturnValue('abcd');
      //@ts-ignore
      mockUnsignedTx.toBuffer.mockReturnValue('abcd');
      const result = await getUnsignedAddDelegator(
        ctx,
        inputObject.nodeID,
        inputObject.stakeAmount,
        inputObject.startTime,
        inputObject.endTime
      );
      expect(result).toHaveProperty('transactionType', 'delegate');
      jest.clearAllMocks();
    });
  });

  describe('addDelegator Testcases [.env]', () => {
    test('Should successfully delegate', async () => {
      const inputObject = fixtures.getUnsignedAddDelegator.insufficientBalance;
      let ctx: Context = contextEnv('.env', 'localflare');
      ctx.pchain.buildAddDelegatorTx = jest.fn();
      const mockUnsignedTx = {
        sign: jest.fn().mockReturnThis()
      } as any;
      const mockTx = {} as any;
      //@ts-ignore
      ctx.pchain.buildAddDelegatorTx.mockResolvedValue(mockUnsignedTx);
      mockUnsignedTx.sign.mockReturnValue(mockTx);
      ctx.pchain.issueTx = jest.fn().mockResolvedValue('mockedTxId');
      const result = await addDelegator(
        ctx,
        inputObject.nodeID,
        inputObject.stakeAmount,
        inputObject.startTime,
        inputObject.endTime
      );
      expect(result).toEqual({ txid: 'mockedTxId' });
      jest.clearAllMocks();
    });
  });
});
