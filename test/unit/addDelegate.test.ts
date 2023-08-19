import { getAddDelegatorParams, getUnsignedAddDelegator } from '../../src/addDelegator';
import { contextEnv } from '../../src/constants';
import { Context } from '../../src/interfaces';
import fixtures from '../fixtures/addDelegateData';
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
    let ctx: Context = contextEnv('.env', 'localflare');
    test('Should throw error for stake amount less than 25000000000', async () => {
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
  });
});
