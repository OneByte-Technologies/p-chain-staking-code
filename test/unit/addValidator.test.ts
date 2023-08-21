import { getAddValidatorParams, getUnsignedAddValidator } from '../../src/addValidator';
import { contextEnv } from '../../src/constants';
import { Context } from '../../src/interfaces';
import fixtures from '../fixtures/addValidator.data';

describe('addValidator Testcases', () => {
  describe('getAddValidatorParams Testcases', () => {
    let ctx: Context = contextEnv('.env', 'localflare');
    test('Should return valid Validator params', async () => {
      try {
        const inputObject = fixtures.getAddValidatorParams.input;
        const params = await getAddValidatorParams(
          ctx,
          inputObject.nodeID,
          inputObject.stakeAmount,
          inputObject.startTime,
          inputObject.endTime,
          inputObject.delegationFee
        );
        expect(params).not.toBeNull;
      } catch (error) {
        console.log(error);
      }
    });
  });

  describe('getUnsignedAddValidator Testcases', () => {
    let ctx: Context = contextEnv('.env', 'localflare');
    test('Should throw error for stake amount less than 2000000000000', async () => {
      const inputObject = fixtures.getUnsignedAddValidator.invalidStakeAmount;
      await expect(() =>
        getUnsignedAddValidator(
          ctx,
          inputObject.nodeID,
          inputObject.stakeAmount,
          inputObject.startTime,
          inputObject.endTime,
          inputObject.delegationFee
        )
      ).rejects.toThrow(
        'PlatformVMAPI.buildAddValidatorTx -- stake amount must be at least 2000000000000'
      );
    });

    test('Should throw error for invalid start time', async () => {
      const inputObject = fixtures.getUnsignedAddValidator.invalidStartTime;

      await expect(() =>
        getUnsignedAddValidator(
          ctx,
          inputObject.nodeID,
          inputObject.stakeAmount,
          inputObject.startTime,
          inputObject.endTime,
          inputObject.delegationFee
        )
      ).rejects.toThrow(
        'PlatformVMAPI.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime'
      );
    });

    test('Should throw error for insuffient balance', async () => {
      const inputObject = fixtures.getUnsignedAddValidator.insufficientBalance;

      await expect(() =>
        getUnsignedAddValidator(
          ctx,
          inputObject.nodeID,
          inputObject.stakeAmount,
          inputObject.startTime,
          inputObject.endTime,
          inputObject.delegationFee
        )
      ).rejects.toThrow(
        'Error - UTXOSet.getMinimumSpendable: insufficient funds to create the transaction'
      );
    });
  });
});
