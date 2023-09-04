## How to run testcases
1. Run `yarn install` to install the dependencies
2. Create an .env with following content:
```
PRIVATE_KEY_CB58 = "88b3cf6b7e9ef18a508209d61311a376bde77be5d069449b1eace71130f8252c"
PRIVATE_KEY_HEX = "88b3cf6b7e9ef18a508209d61311a376bde77be5d069449b1eace71130f8252c"
PUBLIC_KEY = "04423fb5371af0e80750a6481bf9b4adcf2cde38786c4e613855b4f629f8c45ded6720e3335d1110c112c6d1c17fcbb23b9acc29ae5750a27637d385991af15190"
```
3. Run the docker conatiner via `docker-compose up -d`
4. Go to test/helper. and run node queryChain. It will generate output similar to this(note that it may vary):
```
assetId: HK58c7FvFK79cbFsdFf1qVL5bVwQcCRkzZN5Ked8uZsyheeEN
blockchainId for X-chain: ecxi7p3JMYsx6abaYt7b9YiGbj6okQUs8QpqSxMKsFwEioff1
blockchainId for C-chain: 2PyHrN5q8uF7tFLHsiCmG7tmkFWMDjikuYJgnHAXV83o8wMTFD
blockchainId for P-chain: 11111111111111111111111111111111LpoYY
```

5. Now go to node_modules/@flarenetwork/flarejs/dist/utils/constants.js and make changes for the P-chain, C-chain, X-chain and assetId.

6. Run `yarn run coverage` to generate the coverage report