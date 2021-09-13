# ETH -> WETH
yarn task:rinkeby erc20:convert-eth-to-weth --amount 5000000000000000000

# Mint SONE
yarn task:rinkeby sonetoken:mint --address-token sone --amount 3000000000000000000000000 --to owner

### OTHER ACCOUNTS
#  Mint SONE
yarn task:rinkeby sonetoken:mint --address-token sone --amount 200000000000000000000000 --to alice
yarn task:rinkeby sonetoken:mint --address-token sone --amount 200000000000000000000000 --to bob
yarn task:rinkeby sonetoken:mint --address-token sone --amount 200000000000000000000000 --to alice2
yarn task:rinkeby sonetoken:mint --address-token sone --amount 200000000000000000000000 --to bob2

# Transfer tokens
# USDT
yarn task:rinkeby erc20:transfer-token --from owner --to alice --token-address usdt --token-decimals 6
yarn task:rinkeby erc20:transfer-token --from owner --to bob --token-address usdt --token-decimals 6
yarn task:rinkeby erc20:transfer-token --from owner --to alice2 --token-address usdt --token-decimals 6
yarn task:rinkeby erc20:transfer-token --from owner --to bob2 --token-address usdt --token-decimals 6
# USDC
yarn task:rinkeby erc20:transfer-token --from owner --to alice --token-address usdc --token-decimals 6
yarn task:rinkeby erc20:transfer-token --from owner --to bob --token-address usdc --token-decimals 6
yarn task:rinkeby erc20:transfer-token --from owner --to alice2 --token-address usdc --token-decimals 6
yarn task:rinkeby erc20:transfer-token --from owner --to bob2 --token-address usdc --token-decimals 6
# DAI
yarn task:rinkeby erc20:transfer-token --from owner --to alice --token-address dai --token-decimals 18
yarn task:rinkeby erc20:transfer-token --from owner --to bob --token-address dai --token-decimals 18
yarn task:rinkeby erc20:transfer-token --from owner --to alice2 --token-address dai --token-decimals 18
yarn task:rinkeby erc20:transfer-token --from owner --to bob2 --token-address dai --token-decimals 18
# ETH -> WETH
# yarn task:rinkeby erc20:convert-eth-to-weth --account alice --amount 50000000000000000
# yarn task:rinkeby erc20:convert-eth-to-weth --account bob --amount 50000000000000000
# yarn task:rinkeby erc20:convert-eth-to-weth --account alice2 --amount 50000000000000000
# yarn task:rinkeby erc20:convert-eth-to-weth --account bob2 --amount 50000000000000000