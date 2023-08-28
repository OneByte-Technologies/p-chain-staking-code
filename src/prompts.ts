import inquirer from 'inquirer';
import { colorCodes } from './constants';
import { screenConstants } from './screenConstants';

export const prompts = {
    connectWallet: async () => {
        const questions = [
            {
                type: 'list',
                name: 'wallet',
                message: `${colorCodes.magentaColor}How do you want to connect your wallet?${colorCodes.resetColor}`,
                choices: ['Ledger', 'Public Key', `Private Key ${colorCodes.redColor}(not recommended)`],
                filter: function (val: string) {
                    return val.split("(")[0];
                }
            },
        ];
        return inquirer.prompt(questions);
    },

    pvtKeyPath: async () => {
        const questions = [
            {
                type: 'input',
                name: 'pvtKeyPath',
                message: `${colorCodes.magentaColor}Enter Path to Private Key file ${colorCodes.yellowColor}(E.g. /home/wallet/pvtKeyFile)${colorCodes.resetColor}:`,
            },
        ];
        return inquirer.prompt(questions);
    },

    publicKey: async () => {
        const questions = [
            {
                type: 'input',
                name: 'publicKey',
                message: `${colorCodes.magentaColor}Enter your secp256k1 curve public key ${colorCodes.yellowColor}(E.g. 0x02efe41c5d213089cb7a9e808505e9084bb9eb2bf3aa8050ea92a5ae9e20e5a692)${colorCodes.magentaColor}:${colorCodes.resetColor}`,
            },
        ];
        return inquirer.prompt(questions);
    },

    amount: async () => {
        const questions = [
            {
                type: 'input',
                name: 'amount',
                message: `${colorCodes.magentaColor}Enter amount ${colorCodes.yellowColor}(in FLR)${colorCodes.magentaColor}:${colorCodes.resetColor}`,
            },
        ];
        return inquirer.prompt(questions);
    },

    nodeId: async () => {
        const questions = [
            {
                type: 'input',
                name: 'id',
                message: `${colorCodes.magentaColor}Enter Node NodeId ${colorCodes.yellowColor}(E.g. NodeID-FQKTLuZHEsjCxPeFTFgsojsucmdyNDsz1)${colorCodes.magentaColor}:${colorCodes.resetColor}`,
            },
        ];
        return inquirer.prompt(questions);
    },

    unixTime: async (timeType:string) => {
        const questions = [
            {
                type: 'input',
                name: 'time',
                message: `${colorCodes.magentaColor}Enter ${timeType} time${colorCodes.yellowColor}(E.g. 1693185095)${colorCodes.magentaColor}:${colorCodes.resetColor}`,
            },
        ];
        return inquirer.prompt(questions);
    },

    ctxFile: async () => {
        const questions = [
            {
                type: 'list',
                name: 'isContinue',
                message: `${colorCodes.magentaColor}Do you wish to continue with this?${colorCodes.resetColor}`,
                choices: [
                    "yes",
                    "no"
                ],
                filter: (val: string) => {
                    return val == "yes" ? true : false
                }
            },
        ];
        return inquirer.prompt(questions);
    },

    selectNetwork: async () => {
        const questions = [
            {
                type: 'list',
                name: 'network',
                message: `${colorCodes.magentaColor}Which network do you want to connect to?${colorCodes.resetColor}`,
                choices: [`Flare ${colorCodes.greenColor}(Mainnet)`, `Coston2 ${colorCodes.yellowColor}(Testnet)`],
                filter: (val: string) => {
                    const network = val.split(" ")[0]
                    return network == "flare"? "flare" : "costwo"
                }
            },
        ];
        return inquirer.prompt(questions);
    },

    selectTask: async () => {
        const questions = [
            {
                type: 'list',
                name: 'task',
                message: `${colorCodes.magentaColor}What do you want to do?${colorCodes.resetColor}`,
                choices: [
                    ...Object.keys(screenConstants)
                ],
            },
        ];
        return inquirer.prompt(questions);
    },
};
