  import React, { useState, useMemo } from 'react';
  import { useTable, useFilters } from 'react-table';
  import { Line } from 'react-chartjs-2';
  import { Chart, registerables, TimeScale } from 'chart.js';
  import 'chartjs-adapter-moment';
  import moment from 'moment';
  import data from './data/db.json';

  // Register Chart.js components
  Chart.register(...registerables, TimeScale);

  const CustomerTable = () => {
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Memoizing merged data to prevent unnecessary re-renders
    const mergedData = useMemo(() => {
      return data.transactions.map(transaction => {
        const customer = data.customers.find(c => c.id === transaction.customer_id);
        return {
          ...transaction,
          customerName: customer ? customer.name : 'Unknown',
        };
      });
    }, []);

    const columns = useMemo(
      () => [
        {
          Header: 'Customer Name',
          accessor: 'customerName',
        },
        {
          Header: 'Transaction Date',
          accessor: 'date',
        },
        {
          Header: 'Transaction Amount',
          accessor: 'amount',
        },
      ],
      []
    );

    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow,
      setFilter,
    } = useTable({ columns, data: mergedData }, useFilters);

    const handleNameFilterChange = (e) => {
      const value = e.target.value || '';
      setFilter('customerName', value.toLowerCase());
    };

    const handleAmountFilterChange = (e) => {
      const value = e.target.value || '';
      setFilter('amount', value);
    };

    const handleCustomerClick = (customer) => {
      setSelectedCustomer(customer);
    };

    const transactions = useMemo(() => {
      return selectedCustomer
        ? data.transactions.filter(
            (transaction) => transaction.customer_id === selectedCustomer.customer_id
          )
        : [];
    }, [selectedCustomer]);

    const transactionAmountsPerDay = useMemo(() => {
      return transactions.reduce((acc, transaction) => {
        const date = transaction.date;
        acc[date] = (acc[date] || 0) + transaction.amount;
        return acc;
      }, {});
    }, [transactions]);

    const chartData = useMemo(() => {
      return {
        labels: Object.keys(transactionAmountsPerDay).map((date) =>
          moment(date, 'YYYY-MM-DD')
        ),
        datasets: [
          {
            label: 'Transaction Amount',
            data: Object.values(transactionAmountsPerDay),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
          },
        ],
      };
    }, [transactionAmountsPerDay]);

    const chartOptions = {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            parser: 'YYYY-MM-DD',
            tooltipFormat: 'll',
          },
          title: {
            display: true,
            text: 'Date',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Transaction Amount',
          },
        },
      },
    };

    return (
      <div>
        <input
          type="text"
          placeholder="Filter by customer name"
          onChange={handleNameFilterChange}
          className="filter-input"
        />
        <input
          type="number"
          placeholder="Filter by transaction amount"
          onChange={handleAmountFilterChange}
          className="filter-input"
        />
        <table {...getTableProps()} className="customer-table">
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} onClick={() => handleCustomerClick(row.original)}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {selectedCustomer && (
          <div className="customer-details">
            <h2>{selectedCustomer.customerName}'s Transactions</h2>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    );
  };

  export default CustomerTable;
