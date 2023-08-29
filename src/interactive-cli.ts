import { prompts } from "./prompts"
import { taskConstants } from "./screenConstants"
import { colorCodes } from "./constants"
import { Command } from 'commander'
import { cli, initCtxJsonFromOptions } from './cli'
import { TaskConstantsInterface, ConnectWalletInterface, ContextFile } from './interfaces'
import { getPathsAndAddresses } from './ledger/utils';
import { DerivedAddress } from './interfaces';
import fs from 'fs'

export async function interactiveCli(baseargv: string[]) {
    const walletProperties: ConnectWalletInterface = await connectWallet()
    const task = await selectTask()

    const program = new Command("Flare Stake Tool")
    await cli(program)

    if (Object.keys(taskConstants).slice(0, 4).includes(task.toString())) {
        if (walletProperties.wallet.includes("Private Key") && walletProperties.path && walletProperties.network) {
            const args = [...baseargv.slice(0, 2), "info", taskConstants[task], `--env-path=${walletProperties.path}`, `--network=${walletProperties.network}`, "--get-hacked"]
            await program.parseAsync(args)
        } else if (walletProperties.wallet.includes("Public Key")) {
            if (walletProperties.isCreateCtx && walletProperties.network && walletProperties.publicKey) {
                const initArgs = [...baseargv.slice(0, 2), "init-ctx", "-p", walletProperties.publicKey, `--network=${walletProperties.network}`]
                await program.parseAsync(initArgs)
            }
            const args = [...baseargv.slice(0, 2), "info", taskConstants[task], `--ctx-file=ctx.json`]
            await program.parseAsync(args)
        }
        else {
            console.log("Incorrect arguments passed!")
        }
    }
    else if (Object.keys(taskConstants).slice(4, 6).includes(task.toString())) {
        if (walletProperties.wallet.includes("Private Key") && walletProperties.network && walletProperties.path) {
            const amount = await prompts.amount()
            const argsExport = [...baseargv.slice(0, 2), "transaction", taskConstants[task], '-a', `${amount.amount}`, `--env-path=${walletProperties.path}`, `--network=${walletProperties.network}`, "--get-hacked"]
            await program.parseAsync(argsExport)
            const argsImport = [...baseargv.slice(0, 2), "transaction", `import${taskConstants[task].slice(-2)}`, `--env-path=${walletProperties.path}`, `--network=${walletProperties.network}`, "--get-hacked"]
            await program.parseAsync(argsImport)
        }
        else {
            console.log("only pvt key supported right now")
        }
    }
    else {
        console.log("Task not supported")
    }
}

async function connectWallet(): Promise<ConnectWalletInterface> {
    const walletPrompt = await prompts.connectWallet()
    const wallet = walletPrompt.wallet.split("\\")[0] //removing ANSI color code
    if (wallet.includes("Private Key")) {
        console.log(`${colorCodes.redColor}Warning: You are connecting using your private key which is not recommended`)
        const pvtKeyPath = await prompts.pvtKeyPath()
        const path = pvtKeyPath.pvtKeyPath
        const network = await selectNetwork()
        return { wallet, path, network }
    }
    else if (wallet.includes("Public Key")) {
        let isCreateCtx = true
        const isFileExist: Boolean = fileExists("ctx.json");

        if (isFileExist) {
            console.log(`${colorCodes.magentaColor}You already have an existing Ctx file with the following parameters - ${colorCodes.resetColor}`)
            const { network: ctxNetwork, publicKey: ctxPublicKey } = readInfoFromCtx("ctx.json")
            console.log(`${colorCodes.orangeColor}Public Key:${colorCodes.resetColor} ${ctxPublicKey}`)
            console.log(`${colorCodes.orangeColor}Network:${colorCodes.resetColor} ${ctxNetwork}`)
            const getUserChoice = await prompts.ctxFile();
            const isContinue: Boolean = getUserChoice.isContinue

            if (isContinue) {
                isCreateCtx = false
            } else {
                try {
                    fs.unlinkSync('ctx.json');
                    console.log('File "ctx.json" has been deleted.');
                } catch (error) {
                    console.error('An error occurred while deleting the file:', error);
                }
            }
        }

        let publicKey, network
        if (isCreateCtx) {
            const getPublicKey = await prompts.publicKey()
            publicKey = getPublicKey.publicKey
            network = await selectNetwork()
        }

        return { wallet, isCreateCtx, publicKey, network }
    }
    else if (wallet.includes("Ledger")){
        const network = await selectNetwork()

        console.log("Fetching Addresses...")
        const pathList: DerivedAddress[] = await getPathsAndAddresses(network)
        const choiceList = await createChoicesFromAddress(pathList)
        const selectedAddress = await prompts.selectAddress(choiceList)

        const selectedDerivedAddress = pathList.find(item => item.ethAddress == selectedAddress.address)
        const selectedDerivationPath = selectedDerivedAddress?.derivationPath

        const optionsObject = {
            network,
            blind:false,
            ctxFile: 'ctx.json',
            ledger: true
        }
        await initCtxJsonFromOptions(optionsObject,selectedDerivationPath)

        return {wallet , network }
    }
    else {
        return { wallet }
    }
}

async function selectNetwork() {
    const network = await prompts.selectNetwork()
    return network.network
}

async function selectTask(): Promise<keyof TaskConstantsInterface> {
    const task = await prompts.selectTask()
    return task.task
}

function fileExists(filePath: string): Boolean {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (error) {
        return false;
    }
}

async function getDuration(): Promise<{ startTime: string, endTime: string }> {
    const startTime = await prompts.unixTime("start")
    const endTime = await prompts.unixTime("end")
    return {
        startTime: startTime.time,
        endTime: endTime.time
    }
}

function readInfoFromCtx(filePath: string): ContextFile {

    const ctxContent = fs.readFileSync('ctx.json', 'utf-8');
    const ctxData = JSON.parse(ctxContent);

    const publicKey = ctxData.publicKey;
    const network = ctxData.network;

    return { publicKey, network }

}

async function createChoicesFromAddress(pathList : DerivedAddress[]) {
    const choiceList: string[] = []

    for (let i = 0; i < 10; i++) {
        const choice = pathList[i].ethAddress
        choiceList.push(`${i+1}. ${choice}`)
    }

    return choiceList
}