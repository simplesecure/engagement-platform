import React from 'react'
import styled from 'styled-components'
import { useTable } from 'react-table'

// import makeData from '../utils/makeData'

const Styles = styled.div`
  padding: 1rem;

  .user {
    background-color: white;
    color: black;
  }

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`

// Create a default prop getter
const defaultPropGetter = () => ({})

function getBackgroundColor (number) {
  if (!number) return 'white'
  const idx = number.lastIndexOf('%')
  if (number === "100%") {
    return `hsl(230, 80%, 70%)`
  }
  else if (idx > 0) {
    return `hsl(230, 90%, ${100-parseFloat(number.substring(0, idx))*0.8}%)`
  }
  else if (!isNaN(number)) {
    return '#DCDCDC'
  }
  else {
    return 'white'
  }
}

// Expose some prop getters for headers, rows and cells, or more if you want!
function Table({
  columns,
  data,
  getHeaderProps = defaultPropGetter,
  getColumnProps = defaultPropGetter,
  getRowProps = defaultPropGetter,
  getCellProps = defaultPropGetter,
}) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data,
  })

  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th
                // Return an array of prop objects and react-table will merge them appropriately
                {...column.getHeaderProps([
                  {
                    className: column.className,
                    style: column.style,
                  },
                  getColumnProps(column),
                  getHeaderProps(column),
                ])}
              >
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row)
          return (
            // Merge user row props in
            <tr {...row.getRowProps(getRowProps(row))}>
              {row.cells.map(cell => {
                return (
                  <td
                    // Return an array of prop objects and react-table will merge them appropriately
                    {...cell.getCellProps([
                      {
                        className: cell.column.className,
                        style: cell.column.style,
                      },
                      getColumnProps(cell.column),
                      getCellProps(cell),
                    ])}
                  >
                    {cell.render('Cell')}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function RetentionChart(rData) {
  const { retentionData, title } = rData

  const columns = React.useMemo(
    () => [
      {
        Header: '|--|--|',
        columns: [
          {
            Header: 'Cohort',
            accessor: 'cohort',
            className: 'user',
            style: {
              fontWeight: 'bolder',
            },
          },
        ],
      },
      {
        Header: 'Wallets',
        columns: [
          {
            Header: 'Count',
            accessor: 'total',
            className: 'user',
            style: {
              fontWeight: 'bolder',
            },
          },
        ],
      },
      {
        Header: `Retention Data`,
        columns: [
          {
            Header: 'Week 0',
            accessor: 'Week 0',
          },
          {
            Header: 'Week 1',
            accessor: 'Week 1',
          },
          {
            Header: 'Week 2',
            accessor: 'Week 2',
          },
          {
            Header: 'Week 3',
            accessor: 'Week 3',
          },
          {
            Header: 'Week 4',
            accessor: 'Week 4',
          },
          {
            Header: 'Week 5',
            accessor: 'Week 5',
          },
          {
            Header: 'Week 6',
            accessor: 'Week 6',
          }
        ]
      }
    ],
    []
  )

  // const data = React.useMemo(() => makeData(20), [])

  return (
    <Styles>
      <Table
        columns={columns}
        data={retentionData}
        // getHeaderProps={column => ({
        //   onClick: () => alert('Header!'),
        // })}
        // getColumnProps={column => ({
        //   onClick: () => alert('Column!'),
        // })}
        getRowProps={row => ({
          style: {
            background: row.index % 2 === 0 ? 'rgba(0,0,0,.1)' : 'white',
          },
        })}
        getCellProps={cellInfo => ({
          style: {
            backgroundColor: getBackgroundColor(cellInfo.value),
          },
        })}
      />
    </Styles>
  )
}

export default RetentionChart
