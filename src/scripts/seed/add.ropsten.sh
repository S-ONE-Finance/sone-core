# ETH -> WETH
yarn task:ropsten erc20:convert-eth-to-weth \
--amount 500000000000000000

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

# SONE-USDT
yarn task:ropsten router:add-liquidity \
--selected-token sone \
--the-other-token usdt \
--selected-token-desired 1000000000000000000 \
--selected-token-minimum 0 \
--the-other-token-desired 1000000000000000000 \
--the-other-token-minimum 0 \
--to owner