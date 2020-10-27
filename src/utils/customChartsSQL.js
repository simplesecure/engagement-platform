export const customChartsSQL = {
  topBorrowers: function(address) {
    // do something
    return `WITH 
    unique_monitored_wallets as (
      SELECT
        address,
        block_timestamp,
        block_number
      FROM (
        SELECT DISTINCT 
          ON(address) address,
          block_timestamp,
          block_number
        FROM ( 
          SELECT
            address,
            block_timestamp,
            block_id AS block_number
          FROM
            wallets_${address}
        ) AS aggregated_addresses
        ORDER BY address, block_timestamp DESC NULLS LAST, block_number DESC NULLS LAST
      ) AS addresses_newest_timestamp
      ORDER BY block_timestamp DESC NULLS LAST, block_number DESC NULLS LAST
    ),
    contract_mappings AS (
      SELECT 
        JSONB_PATH_QUERY(mappings, '$.eventMap[*]') AS event
      FROM 
        contracts
      WHERE 
        address = '${address}'
    ),
    --
    --
    -- Borrow::borrowAmount CTEs:
    --
    Borrow_event_map AS (
        SELECT 
          event
        FROM 
          contract_mappings
        WHERE
          JSONB_PATH_EXISTS(contract_mappings.event, '$.name ? (@ == "Borrow")')
    ),
    Borrow_all_inputs AS (
        SELECT 
          JSONB_PATH_QUERY(event, '$.inputs[*]') AS input
        FROM 
          Borrow_event_map
    ),
    Borrow_unindexed_inputs AS (
      SELECT
        input,
        CAST(ROW_NUMBER() OVER () AS INT) AS position_num
      FROM 
        Borrow_all_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.indexed ? (@ == false)')
    ),
    Borrow_borrowAmount_position_num AS (
      SELECT 
        position_num AS value
      FROM 
        Borrow_unindexed_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.name ? (@ == "borrowAmount")')
    ),
    Borrow_borrower_position_num AS (
      SELECT 
        position_num AS value
      FROM 
        Borrow_unindexed_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.name ? (@ == "borrower")')
    ),
    Borrow_sign AS (
    SELECT 
      event ->> 'sign' AS value
    FROM 
      Borrow_event_map
    ),
    Borrow_borrowAmount AS (
      SELECT
        mw.address AS address,
        SUM(value) AS totalBorrow,
        STRING_AGG(hash, E'\n') AS hashes,
        COUNT(hash) AS hash_count,
        MAX(wallets.block_timestamp) AS block_timestamp
      FROM
        unique_monitored_wallets AS mw
      INNER JOIN (
        SELECT
    --      from_address AS address,
          uhex_to_address(get_param_hex_at_index((SELECT value FROM Borrow_borrower_position_num), data)) AS address,
          uhex_to_decimal(get_param_hex_at_index((SELECT value FROM Borrow_borrowAmount_position_num), data)) AS value,
          hash,
          logs.block_timestamp AS block_timestamp
        FROM 
          logs_${address} AS logs 
        LEFT JOIN transactions_${address} AS txns
          ON logs.transaction_hash = txns.hash
        WHERE ( 
            topics [ 1 ] = (SELECT value FROM Borrow_sign)
              AND
            uhex_to_decimal(get_param_hex_at_index((SELECT value FROM Borrow_borrowAmount_position_num), data)) > 0
        )
      ) AS wallets
      ON mw.address = wallets.address
      GROUP BY mw.address
    ),
    --
    --
    -- RepayBorrow::repayAmount CTEs:
    --
    RepayBorrow_event_map AS (
        SELECT 
          event
        FROM 
          contract_mappings
        WHERE
          JSONB_PATH_EXISTS(contract_mappings.event, '$.name ? (@ == "RepayBorrow")')
    ),
    RepayBorrow_all_inputs AS (
        SELECT 
          JSONB_PATH_QUERY(event, '$.inputs[*]') AS input
        FROM 
          RepayBorrow_event_map
    ),
    RepayBorrow_unindexed_inputs AS (
      SELECT
        input,
        CAST(ROW_NUMBER() OVER () AS INT) AS position_num
      FROM 
        RepayBorrow_all_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.indexed ? (@ == false)')
    ),
    RepayBorrow_repayAmount_position_num AS (
      SELECT 
        position_num AS value
      FROM 
        RepayBorrow_unindexed_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.name ? (@ == "repayAmount")')
    ),
    RepayBorrow_payer_position_num AS (
      SELECT 
        position_num AS value
      FROM 
        RepayBorrow_unindexed_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.name ? (@ == "payer")')
    ),
    RepayBorrow_borrower_position_num AS (
      SELECT 
        position_num AS value
      FROM 
        RepayBorrow_unindexed_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.name ? (@ == "borrower")')
    ),
    
    RepayBorrow_sign AS (
    SELECT 
      event ->> 'sign' AS value
    FROM 
      RepayBorrow_event_map
    ),
    RepayBorrow_repayAmount AS (
      SELECT
        mw.address AS address,
        SUM(value) as totalRepayBorrow,
        STRING_AGG(hash, E'\n') AS hashes,
        COUNT(hash) AS hash_count,
        MAX(wallets.block_timestamp) AS block_timestamp
      FROM
        unique_monitored_wallets AS mw
      INNER JOIN (
        SELECT
    --      from_address AS address,
          uhex_to_address(get_param_hex_at_index((SELECT value FROM RepayBorrow_borrower_position_num), data)) AS address,
          uhex_to_decimal(get_param_hex_at_index((SELECT value FROM RepayBorrow_repayAmount_position_num), data)) AS value,
          hash,
          logs.block_timestamp AS block_timestamp
        FROM 
          logs_${address} AS logs
        LEFT JOIN transactions_${address} AS txns 
          ON logs.transaction_hash = txns.hash
        WHERE ( 
            topics [ 1 ] = (SELECT value FROM RepayBorrow_sign)
              AND
            uhex_to_decimal(get_param_hex_at_index((SELECT value FROM RepayBorrow_repayAmount_position_num), data)) > 0
        )
      ) AS wallets
      ON mw.address = wallets.address
      GROUP BY mw.address
    ),
    --
    --
    -- LiquidateBorrow::repayAmount CTEs:
    --
    LiquidateBorrow_event_map AS (
        SELECT 
          event
        FROM 
          contract_mappings
        WHERE
          JSONB_PATH_EXISTS(contract_mappings.event, '$.name ? (@ == "LiquidateBorrow")')
    ),
    LiquidateBorrow_all_inputs AS (
        SELECT 
          JSONB_PATH_QUERY(event, '$.inputs[*]') AS input
        FROM 
          LiquidateBorrow_event_map
    ),
    LiquidateBorrow_unindexed_inputs AS (
      SELECT
        input,
        CAST(ROW_NUMBER() OVER () AS INT) AS position_num
      FROM 
        LiquidateBorrow_all_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.indexed ? (@ == false)')
    ),
    LiquidateBorrow_repayAmount_position_num AS (
      SELECT 
        position_num AS value
      FROM 
        LiquidateBorrow_unindexed_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.name ? (@ == "repayAmount")')
    ),
    LiquidateBorrow_payer_position_num AS (
      SELECT 
        position_num AS value
      FROM 
        LiquidateBorrow_unindexed_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.name ? (@ == "liquidator")')
    ),
    LiquidateBorrow_borrower_position_num AS (
      SELECT 
        position_num AS value
      FROM 
        LiquidateBorrow_unindexed_inputs
      WHERE 
        JSONB_PATH_EXISTS(input, '$.name ? (@ == "borrower")')
    ),
    LiquidateBorrow_sign AS (
    SELECT 
      event ->> 'sign' AS value
    FROM 
      LiquidateBorrow_event_map
    ),
    LiquidateBorrow_repayAmount AS (
      SELECT
        mw.address AS address,
        SUM(value) as totalLiquidateBorrow,
        STRING_AGG(hash, E'\n') AS hashes,
        COUNT(hash) AS hash_count,
        MAX(wallets.block_timestamp) AS block_timestamp
      FROM
        unique_monitored_wallets AS mw
      INNER JOIN (
        SELECT
    --      from_address AS address,
          uhex_to_address(get_param_hex_at_index((SELECT value FROM LiquidateBorrow_borrower_position_num), data)) AS address,
          uhex_to_decimal(get_param_hex_at_index((SELECT value FROM LiquidateBorrow_repayAmount_position_num), data)) AS value,
          hash,
          logs.block_timestamp AS block_timestamp
        FROM 
          logs_${address} AS logs
        LEFT JOIN transactions_${address} AS txns 
          ON logs.transaction_hash = txns.hash
        WHERE ( 
            topics [ 1 ] = (SELECT value FROM LiquidateBorrow_sign)
              AND
            uhex_to_decimal(get_param_hex_at_index((SELECT value FROM LiquidateBorrow_repayAmount_position_num), data)) > 0
        )
      ) AS wallets
      ON mw.address = wallets.address
      GROUP BY mw.address
    )
    SELECT
      'address' as address,
      'totalOutstandingBorrow (desc)' as amount,
      'hashes' as hashes,
      'hash count' as hash_count,
      'block timestamp' as block_timestamp
    UNION ALL (
      SELECT
        address,
        totalOutstanding::text as amount,
        hashes,
        hash_count::text,
        block_timestamp::text
      FROM (
        SELECT
          address,
          SUM(wei) AS totalOutstanding,
          STRING_AGG(hashes, E'\n') AS hashes,
          SUM(hash_count) AS hash_count,
          MAX(block_timestamp) AS block_timestamp
        FROM (
          SELECT
            address,
            -totalBorrow as wei,
            hashes,
            hash_count,
            block_timestamp
          FROM
            Borrow_borrowAmount
          UNION ALL
          SELECT
            address,
            totalRepayBorrow as wei,
            hashes,
            hash_count,
            block_timestamp
          FROM
            RepayBorrow_repayAmount
          UNION ALL
          SELECT
            address,
            totalLiquidateBorrow as wei,
            hashes,
            hash_count,
            block_timestamp
          FROM
            LiquidateBorrow_repayAmount
        ) AS repay_and_borrow
        GROUP BY address
      ) AS outstanding
      ORDER BY totalOutstanding ASC NULLS LAST, block_timestamp::timestamptz DESC NULLS LAST, hash_count::numeric ASC NULLS LAST
      LIMIT 50
    )`
  }
}