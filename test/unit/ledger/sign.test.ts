import { sign } from '../../../src/ledger/sign';
import fs from 'fs';
jest.mock('fs');


describe.skip('ledger/sign testcases', () => {
  test('should throw an error when unable to read the transaction file', async () => {
    // Mock file read error
    //@ts-ignore
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File read error');
    });

    const mockDerivationPath = "m/44'/9000'/0'/0/0";

    // Execute the sign function and expect it to throw an error
    await expect(sign('unsignedTx.json', mockDerivationPath)).rejects.toThrow('File read error');
  });
});
