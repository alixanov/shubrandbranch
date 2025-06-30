// 🔃 Importlar
import React, { useState } from "react";
import {
  Button,
  Modal,
  Table,
  Popover,
  Input,
  Select,
  message,
  Popconfirm,
} from "antd";
import { FaEye, FaPrint } from "react-icons/fa";
import {
  useCreatePaymentToMasterMutation,
  useDeleteMasterMutation,
  useGetMastersQuery,
} from "../../context/service/master.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { MdDelete } from "react-icons/md";

const { Option } = Select;

const MastersModal = ({ visible, onClose }) => {
  const { data: masters = [] } = useGetMastersQuery();
  const [openSalesPopover, setOpenSalesPopover] = useState(null);
  const [openPaymentPopover, setOpenPaymentPopover] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState({});
  const [createPayment] = useCreatePaymentToMasterMutation();
  const [deleteMaster] = useDeleteMasterMutation();
  const { data: rate = {} } = useGetUsdRateQuery();

  const usdRate = rate.rate;

  // 80mm chek chiqarish funksiyasi
  const printReceipt = (masterName, carName, paymentData) => {
    const receiptWindow = window.open("", "_blank");
    const currentDate = new Date().toLocaleString("uz-UZ");

    const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>To'lov Cheki</title>
                <style>
                    @media print {
                        @page {
                            size: 80mm auto;
                            margin: 0;
                        }
                        body {
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            line-height: 1.2;
                            margin: 0;
                            padding: 5mm;
                            width: 70mm;
                        }
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        line-height: 1.2;
                        margin: 0;
                        padding: 5mm;
                        width: 70mm;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 5px;
                        margin-bottom: 10px;
                    }
                    .company-name {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 3px;
                    }
                    .receipt-title {
                        font-size: 14px;
                        font-weight: bold;
                    }
                    .info-section {
                        margin: 10px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 3px 0;
                    }
                    .total {
                        border-top: 1px dashed #000;
                        border-bottom: 1px dashed #000;
                        padding: 8px 0;
                        margin: 10px 0;
                        font-weight: bold;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 15px;
                        font-size: 10px;
                        border-top: 1px dashed #000;
                        padding-top: 8px;
                    }
                    .thank-you {
                        font-size: 12px;
                        text-align: center;
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">AVTO EHTIYOT QISMLARI</div>
                    <div class="receipt-title">TO'LOV CHEKI</div>
                </div>
                
                <div class="info-section">
                    <div class="info-row">
                        <span>Sana:</span>
                        <span>${currentDate}</span>
                    </div>
                    <div class="info-row">
                        <span>Usta:</span>
                        <span>${masterName}</span>
                    </div>
                    <div class="info-row">
                        <span>Mashina:</span>
                        <span>${carName}</span>
                    </div>
                </div>
                
                <div class="total">
                    <div class="info-row">
                        <span>To'lov miqdori:</span>
                        <span>${Number(
                          paymentData.amount
                        ).toLocaleString()} ${paymentData.currency.toUpperCase()}</span>
                    </div>
                    <div class="info-row">
                        <span>To'lov usuli:</span>
                        <span>${
                          paymentData.payment_method === "cash"
                            ? "Naqd pul"
                            : "Karta orqali"
                        }</span>
                    </div>
                </div>
                
                <div class="thank-you">
                    Rahmat!
                </div>
                
                <div class="footer">
                    Chek №: ${Date.now()}<br>
                    Kassir: Admin
                </div>
            </body>
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    }
                }
            </script>
            </html>
        `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  const handlePayment = async (masterId, carId) => {
    const { amount, currency, payment_method } = selectedPayment;
    if (!amount || !currency) return message.warning("To'liq to'ldiring");

    try {
      await createPayment({
        master_id: masterId,
        car_id: carId,
        payment: { amount, currency, payment_method },
      });

      message.success("To'lov qo'shildi");

      // Chek chiqarish uchun kerakli ma'lumotlarni topish
      const master = masters.find((m) => m._id === masterId);
      const car = master?.cars.find((c) => c._id === carId);

      if (master && car) {
        // Chek chiqarish
        printReceipt(master.master_name, car.car_name, selectedPayment);
      }

      setOpenPaymentPopover(null);
      setSelectedPayment({});
    } catch (err) {
      message.error("Xatolik yuz berdi");
    }
  };

  const carColumns = (cars = []) => [
    {
      title: "Mashina nomi",
      dataIndex: "car_name",
    },
    {
      title: "Amallar",
      render: (_, car) => (
        <Popover
          content={
            <Table
              size="small"
              pagination={false}
              columns={[
                { title: "Mahsulot", dataIndex: "product_name" },
                { title: "Miqdor", dataIndex: "quantity" },
                {
                  title: "Narx",
                  dataIndex: "sell_price",
                  render: (text) => text.toFixed(2),
                },
                {
                  title: "Valyuta",
                  dataIndex: "currency",
                  render: (text) => text.toUpperCase(),
                },
                {
                  title: "Jami",
                  dataIndex: "total_price",
                  render: (text) => text.toFixed(2),
                },
              ]}
              dataSource={car.sales}
              rowKey={(item) => item.product_id}
            />
          }
          trigger="click"
          open={openSalesPopover === car._id}
          onOpenChange={(open) => setOpenSalesPopover(open ? car._id : null)}
        >
          <Button icon={<FaEye />} size="small" />
        </Popover>
      ),
    },
    {
      title: "Umumiy sotuv (so'mda)",
      render: (_, car) => {
        const total = car.sales?.reduce((sum, sale) => {
          const converted =
            sale.currency === "usd"
              ? sale.total_price * usdRate
              : sale.total_price;
          return sum + converted;
        }, 0);
        return total.toLocaleString();
      },
    },
    {
      title: "To'langan (so'mda)",
      render: (_, car) => {
        const total = car.payment_log?.reduce((sum, p) => {
          const converted =
            p.currency === "usd" ? p.amount * usdRate : p.amount;
          return sum + converted;
        }, 0);
        return total.toLocaleString();
      },
    },
    {
      title: "Qolgan (so'mda)",
      render: (_, car) => {
        const totalSales = car.sales?.reduce((sum, sale) => {
          const converted =
            sale.currency === "usd"
              ? sale.total_price * usdRate
              : sale.total_price;
          return sum + converted;
        }, 0);
        const totalPayments = car.payment_log?.reduce((sum, p) => {
          const converted =
            p.currency === "usd" ? p.amount * usdRate : p.amount;
          return sum + converted;
        }, 0);
        const remaining = totalSales - totalPayments;
        return remaining <= 0 ? "To'liq to'langan" : remaining.toLocaleString();
      },
    },
    {
      title: "To'lov tarixi",
      render: (_, car) => (
        <Popover
          content={
            <Table
              size="small"
              pagination={false}
              columns={[
                { title: "Miqdor", dataIndex: "amount" },
                {
                  title: "Valyuta",
                  dataIndex: "currency",
                  render: (c) => c.toUpperCase(),
                },
                {
                  title: "To'lov usuli",
                  dataIndex: "payment_method",
                  render: (text) => (text === "cash" ? "Naqd" : "Karta"),
                },
                {
                  title: "Sana",
                  dataIndex: "date",
                  render: (d) => new Date(d).toLocaleDateString(),
                },
              ]}
              dataSource={car.payment_log}
              rowKey={(row, i) => i}
            />
          }
          trigger="click"
        >
          <Button size="small" icon={<FaEye />} />
        </Popover>
      ),
    },
    {
      title: "To'lov",
      render: (_, car) => (
        <Popover
          trigger="click"
          open={openPaymentPopover === car._id}
          onOpenChange={(open) => setOpenPaymentPopover(open ? car._id : null)}
          content={
            <div style={{ width: 200 }}>
              <Input
                placeholder="Miqdori"
                type="number"
                value={selectedPayment.amount || ""}
                onChange={(e) =>
                  setSelectedPayment({
                    ...selectedPayment,
                    amount: e.target.value,
                  })
                }
              />
          
              <Select
                placeholder="To'lov usulini tanlang"
                value={selectedPayment.payment_method}
                onChange={(value) =>
                  setSelectedPayment({
                    ...selectedPayment,
                    payment_method: value,
                  })
                }
                style={{ width: "100%", marginTop: 8 }}
              >
                <Option value="cash">Naqd</Option>
                <Option value="card">Karta</Option>
              </Select>
              <Button
                type="primary"
                style={{ marginTop: 10, width: "100%" }}
                icon={<FaPrint />}
                onClick={() => handlePayment(car.master_id, car._id)}
              >
                To'lov va Chek chiqarish
              </Button>
            </div>
          }
        >
          <Button size="small">To'lov</Button>
        </Popover>
      ),
    },
  ];

  const masterColumns = [
    {
      title: "Ismi",
      dataIndex: "master_name",
    },
    {
      title: "Umumiy sotuv (so'mda)",
      dataIndex: "cars",
      render: (cars) => {
        const totalSum = cars.reduce((acc, car) => {
          const carSales = car.sales || [];
          const carTotal = carSales.reduce((sum, sale) => {
            const price = sale.total_price;
            const converted = sale.currency === "usd" ? price * usdRate : price;
            return sum + converted;
          }, 0);
          return acc + carTotal;
        }, 0);
        return totalSum.toLocaleString();
      },
    },
    {
      title: "O'chirish",
      render: (_, record) => (
        <Popconfirm
          title="Chindan ham ustani o'chirmoqchimisiz?"
          okText="Ha"
          cancelText="Yo'q"
          onCancel={() => {}}
          onConfirm={() => {
            deleteMaster({ master_id: record._id });
          }}
        >
          <Button
            variant="outlined"
            color="danger"
            icon={<MdDelete />}
          ></Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      title="Ustalar ro'yxati"
    >
      <Table
        dataSource={masters}
        columns={masterColumns}
        rowKey={(record) => record._id}
        pagination={false}
        expandable={{
          expandedRowRender: (record) => (
            <Table
              columns={carColumns(record.cars)}
              dataSource={record.cars.map((car, i) => ({
                ...car,
                master_id: record._id,
              }))}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          ),
        }}
      />
    </Modal>
  );
};

export default MastersModal;
