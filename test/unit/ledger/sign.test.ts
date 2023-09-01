import { ledgerSign, signId } from '../../../src/ledger/sign';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import AvalancheApp from '@avalabs/hw-app-avalanche';
import { sha256 } from 'ethereumjs-util';

jest.mock('@avalabs/hw-app-avalanche');
jest.mock('@ledgerhq/hw-transport-node-hid');
jest.mock('ethereumjs-util');
describe('ledger/sign testcases', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully sign a blind transaction', async () => {
    // Mock the necessary dependencies and their responses.
    const mockTransport = {
      open: jest.fn().mockResolvedValue({})
    };
    const mockAvalanche = {
      signHash: jest.fn().mockResolvedValue({
        errorMessage: 'No errors',
        returnCode: 0,
        signatures: {
          get: jest.fn().mockResolvedValue('mocksign')
        }
      })
    };
    //@ts-ignore
    TransportNodeHid.open.mockResolvedValue(mockTransport);
    //@ts-ignore
    AvalancheApp.mockImplementation(() => mockAvalanche);
    //@ts-ignore
    sha256.mockReturnValue(Buffer.from('mockedMessageHash', 'hex'));

    const mockTx = {
      signatureRequests: [{ message: 'mockedMessage' }],
      unsignedTransactionBuffer: 'mockedUnsignedTxBuffer'
    };
    jest
      .spyOn(require('../../../src/ledger/utils'), 'recoverTransactionPublicKey')
      .mockReturnValue(
        '04423fb5371af0e80750a6481bf9b4adcf2cde38786c4e613855b4f629f8c45ded6720e3335d1110c112c6d1c17fcbb23b9acc29ae5750a27637d385991af15190'
      );
    jest
      .spyOn(require('../../../src/ledger/utils'), 'recoverTransactionSigner')
      .mockReturnValue('0xfa32C77AA014584bB9c3F69d8D1d74B8844e1A92');
    //@ts-ignore
    const result = await ledgerSign(mockTx, "m/44'/9000'/0'/0/0", true);
    expect(result).toHaveProperty('address', '0xfa32C77AA014584bB9c3F69d8D1d74B8844e1A92');

    // Verify that the required functions were called.
    expect(AvalancheApp).toHaveBeenCalled();
  });
});
