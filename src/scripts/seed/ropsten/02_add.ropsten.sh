# DAI-WETH
yarn task:ropsten router:add-liquidity \
--selected-token dai \
--the-other-token weth \
--selected-token-desired 250000000000000000000 \
--selected-token-minimum 0 \
--the-other-token-desired 100000000000000000 \
--the-other-token-minimum 0 \
--to owner

# USDC-WETH
yarn task:ropsten router:add-liquidity \
--selected-token usdc \
--the-other-token weth \
--selected-token-desired 250000000 \
--selected-token-minimum 0 \
--the-other-token-desired 100000000000000000 \
--the-other-token-minimum 0 \
--to owner

# USDT-WETH
yarn task:ropsten router:add-liquidity \
--selected-token usdt \
--the-other-token weth \
--selected-token-desired 250100000 \
--selected-token-minimum 0 \
--the-other-token-desired 100000000000000000 \
--the-other-token-minimum 0 \
--to owner

# SONE-WETH
yarn task:ropsten router:add-liquidity \
--selected-token sone \
--the-other-token weth \
--selected-token-desired 5000000000000000000000 \
--selected-token-minimum 0 \
--the-other-token-desired 1000000000000000000 \
--the-other-token-minimum 0 \
--to owner

# SONE-USDT
yarn task:ropsten router:add-liquidity \
--selected-token sone \
--the-other-token usdt \
--selected-token-desired 2000000000000000000 \
--selected-token-minimum 0 \
--the-other-token-desired 1000000 \
--the-other-token-minimum 0 \
--to owner


### OTHER ACCOUNTS
# DAI-WETH
yarn task:ropsten router:add-liquidity --selected-token dai --the-other-token weth --selected-token-desired 250000000000000000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to alice
yarn task:ropsten router:add-liquidity --selected-token dai --the-other-token weth --selected-token-desired 250000000000000000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to bob
yarn task:ropsten router:add-liquidity --selected-token dai --the-other-token weth --selected-token-desired 250000000000000000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to alice2
yarn task:ropsten router:add-liquidity --selected-token dai --the-other-token weth --selected-token-desired 250000000000000000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to bob2

# USDC-WETH
yarn task:ropsten router:add-liquidity --selected-token usdc --the-other-token weth --selected-token-desired 250000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to alice
yarn task:ropsten router:add-liquidity --selected-token usdc --the-other-token weth --selected-token-desired 250000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to bob
yarn task:ropsten router:add-liquidity --selected-token usdc --the-other-token weth --selected-token-desired 250000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to alice2
yarn task:ropsten router:add-liquidity --selected-token usdc --the-other-token weth --selected-token-desired 250000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to bob2

# USDT-WETH
yarn task:ropsten router:add-liquidity --selected-token usdt --the-other-token weth --selected-token-desired 250100000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to alice
yarn task:ropsten router:add-liquidity --selected-token usdt --the-other-token weth --selected-token-desired 250100000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to bob
yarn task:ropsten router:add-liquidity --selected-token usdt --the-other-token weth --selected-token-desired 250100000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to alice2
yarn task:ropsten router:add-liquidity --selected-token usdt --the-other-token weth --selected-token-desired 250100000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to bob2

# SONE-WETH
yarn task:ropsten router:add-liquidity --selected-token sone --the-other-token weth --selected-token-desired 5000000000000000000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to alice
yarn task:ropsten router:add-liquidity --selected-token sone --the-other-token weth --selected-token-desired 5000000000000000000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to bob
yarn task:ropsten router:add-liquidity --selected-token sone --the-other-token weth --selected-token-desired 5000000000000000000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to alice2
yarn task:ropsten router:add-liquidity --selected-token sone --the-other-token weth --selected-token-desired 5000000000000000000000 --selected-token-minimum 0 --the-other-token-desired 10000000000000000 --the-other-token-minimum 0 --to bob2

# SONE-USDT
yarn task:ropsten router:add-liquidity --selected-token sone --the-other-token usdt --selected-token-desired 200000000000000000 --selected-token-minimum 0 --the-other-token-desired 100000 --the-other-token-minimum 0 --to alice
yarn task:ropsten router:add-liquidity --selected-token sone --the-other-token usdt --selected-token-desired 200000000000000000 --selected-token-minimum 0 --the-other-token-desired 100000 --the-other-token-minimum 0 --to bob
yarn task:ropsten router:add-liquidity --selected-token sone --the-other-token usdt --selected-token-desired 200000000000000000 --selected-token-minimum 0 --the-other-token-desired 100000 --the-other-token-minimum 0 --to alice2
yarn task:ropsten router:add-liquidity --selected-token sone --the-other-token usdt --selected-token-desired 200000000000000000 --selected-token-minimum 0 --the-other-token-desired 100000 --the-other-token-minimum 0 --to bob2