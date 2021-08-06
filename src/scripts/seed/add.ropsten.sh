yarn task:ropsten erc20:convert-eth-to-weth \
--amount 500000000000000000

yarn task:ropsten router:add-liquidity \
--selected-token dai \
--the-other-token weth \
--selected-token-desired 250000000000000000000 \
--selected-token-minimum 0 \
--the-other-token-desired 100000000000000000 \
--the-other-token-minimum 0 \
--to owner

yarn task:ropsten router:add-liquidity \
--selected-token usdc \
--the-other-token weth \
--selected-token-desired 250000000 \
--selected-token-minimum 0 \
--the-other-token-desired 100000000000000000 \
--the-other-token-minimum 0 \
--to owner

yarn task:ropsten router:add-liquidity \
--selected-token usdt \
--the-other-token weth \
--selected-token-desired 250100000 \
--selected-token-minimum 0 \
--the-other-token-desired 100000000000000000 \
--the-other-token-minimum 0 \
--to owner

yarn task:ropsten router:swap \
--selected-token weth \
--the-other-token usdt \
--input-amount 12000000000000000 \
--to owner

yarn task:ropsten router:swap \
--selected-token weth \
--the-other-token usdc \
--input-amount 12000000000000000 \
--to owner

yarn task:ropsten router:swap \
--selected-token weth \
--the-other-token dai \
--input-amount 12000000000000000 \
--to owner