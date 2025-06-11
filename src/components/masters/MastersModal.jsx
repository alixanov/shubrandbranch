// 🔃 Importlar
import React, { useState } from 'react';
import { Button, Modal, Table, Popover, Input, Select, message } from 'antd';
import { FaEye } from 'react-icons/fa';
import { useCreatePaymentToMasterMutation, useGetMastersQuery } from '../../context/service/master.service';
import { useGetUsdRateQuery } from '../../context/service/usd.service';

const { Option } = Select;

const MastersModal = ({ visible, onClose }) => {
    const { data: masters = [] } = useGetMastersQuery();
    const [openSalesPopover, setOpenSalesPopover] = useState(null);
    const [openPaymentPopover, setOpenPaymentPopover] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState({});
    const [createPayment] = useCreatePaymentToMasterMutation();
    const { data: rate = {} } = useGetUsdRateQuery()
    console.log(rate);

    const usdRate = rate.rate

    const handlePayment = async (masterId, carId) => {
        const { amount, currency } = selectedPayment;
        if (!amount || !currency) return message.warning("To'liq to'ldiring");
        try {
            await createPayment({
                master_id: masterId,
                car_id: carId,
                payment: { amount, currency }
            });
            message.success("To'lov qo'shildi");
            setOpenPaymentPopover(null);
            setSelectedPayment({});
        } catch (err) {
            message.error("Xatolik yuz berdi");
        }
    };


    const carColumns = (cars = []) => [
        {
            title: 'Mashina nomi',
            dataIndex: 'car_name'
        },
        {
            title: 'Amallar',
            render: (_, car) => (
                <Popover
                    content={(
                        <Table
                            size="small"
                            pagination={false}
                            columns={[
                                { title: 'Mahsulot', dataIndex: 'product_name' },
                                { title: 'Miqdor', dataIndex: 'quantity' },
                                { title: 'Narx', dataIndex: 'sell_price', render: (text) => text.toFixed(2) },
                                { title: 'Valyuta', dataIndex: 'currency', render: (text) => text.toUpperCase() },
                                { title: 'Jami', dataIndex: 'total_price', render: (text) => text.toFixed(2) },
                            ]
                            }
                            dataSource={car.sales}
                            rowKey={(item) => item.product_id}
                        />
                    )}
                    trigger="click"
                    open={openSalesPopover === car._id}
                    onOpenChange={(open) => setOpenSalesPopover(open ? car._id : null)}
                >
                    <Button icon={<FaEye />} size="small" />
                </Popover >
            )
        },
        {
            title: "Umumiy sotuv (so'mda)",
            render: (_, car) => {
                const total = car.sales?.reduce((sum, sale) => {
                    const converted = sale.currency === 'usd' ? sale.total_price * usdRate : sale.total_price;
                    return sum + converted;
                }, 0);
                return total.toLocaleString();
            }
        },
        {
            title: "To'langan (so'mda)",
            render: (_, car) => {
                const total = car.payment_log?.reduce((sum, p) => {
                    const converted = p.currency === 'usd' ? p.amount * usdRate : p.amount;
                    return sum + converted;
                }, 0);
                return total.toLocaleString();
            }
        },
        {
            title: "Qolgan (so'mda)",
            render: (_, car) => {
                const totalSales = car.sales?.reduce((sum, sale) => {
                    const converted = sale.currency === 'usd' ? sale.total_price * usdRate : sale.total_price;
                    return sum + converted;
                }, 0);
                const totalPayments = car.payment_log?.reduce((sum, p) => {
                    const converted = p.currency === 'usd' ? p.amount * usdRate : p.amount;
                    return sum + converted;
                }, 0);
                const remaining = totalSales - totalPayments;
                return remaining <= 0 ? "To‘liq to‘langan" : remaining.toLocaleString();
            }
        },
        {
            title: "To'lov tarixi",
            render: (_, car) => (
                <Popover
                    content={(
                        <Table
                            size="small"
                            pagination={false}
                            columns={[
                                { title: "Miqdor", dataIndex: "amount" },
                                { title: "Valyuta", dataIndex: "currency", render: c => c.toUpperCase() },
                                { title: "Sana", dataIndex: "date", render: d => new Date(d).toLocaleDateString() }
                            ]}
                            dataSource={car.payment_log}
                            rowKey={(row, i) => i}
                        />
                    )}
                    trigger="click"
                >
                    <Button size="small" icon={<FaEye />} />
                </Popover>
            )
        },
        {
            title: "To'lov",
            render: (_, car) => (
                <Popover
                    trigger="click"
                    open={openPaymentPopover === car._id}
                    onOpenChange={(open) => setOpenPaymentPopover(open ? car._id : null)}
                    content={(
                        <div style={{ width: 200 }}>
                            <Input
                                placeholder="Miqdori"
                                type="number"
                                onChange={(e) => setSelectedPayment({ ...selectedPayment, amount: e.target.value })}
                            />
                            <Select
                                defaultValue="sum"
                                onChange={(value) => setSelectedPayment({ ...selectedPayment, currency: value })}
                                style={{ width: '100%', marginTop: 8 }}
                            >
                                <Option value="sum">So'm</Option>
                                <Option value="usd">USD</Option>
                            </Select>
                            <Button
                                type="primary"
                                style={{ marginTop: 10, width: '100%' }}
                                onClick={() => handlePayment(car.master_id, car._id)}
                            >
                                To'lovni yuborish
                            </Button>
                        </div>
                    )}
                >
                    <Button size="small">To‘lov</Button>
                </Popover>
            )
        }
    ];

    const masterColumns = [
        {
            title: 'Ismi',
            dataIndex: 'master_name'
        },
        // {
        //     title: 'To\'lov',
        //     render: (_, record) => (
        //         <Popover
        //             trigger="click"
        //             open={openPaymentPopover === record._id}
        //             onOpenChange={(open) => setOpenPaymentPopover(open ? record._id : null)}
        //             content={(
        //                 <div style={{ width: 200 }}>
        //                     <Input
        //                         placeholder="Miqdori"
        //                         type="number"
        //                         onChange={(e) => setSelectedPayment({ ...selectedPayment, amount: e.target.value })}
        //                     />
        //                     <Select
        //                         defaultValue="sum"
        //                         onChange={(value) => setSelectedPayment({ ...selectedPayment, currency: value })}
        //                         style={{ width: '100%', marginTop: 8 }}
        //                     >
        //                         <Option value="sum">So'm</Option>
        //                         <Option value="usd">USD</Option>
        //                     </Select>
        //                     <Button
        //                         type="primary"
        //                         style={{ marginTop: 10, width: '100%' }}
        //                         onClick={() => handlePayment(record._id)}
        //                     >
        //                         To'lovni yuborish
        //                     </Button>
        //                 </div>
        //             )}
        //         >
        //             <Button size="small">To'lov</Button>
        //         </Popover>
        //     )
        // },
        // {
        //     title: "To'lov tarixi",
        //     render: (_, record) => (
        //         <Popover
        //             trigger="click"
        //             content={(
        //                 <Table
        //                     size="small"
        //                     columns={[
        //                         { title: 'Miqdor', dataIndex: 'amount', render: (text) => Number(text).toLocaleString() },
        //                         { title: 'Valyuta', dataIndex: 'currency', render: (text) => text.toUpperCase() },
        //                         { title: 'Sana', dataIndex: 'date', render: (date) => new Date(date).toLocaleDateString() },
        //                     ]}
        //                     dataSource={record.payment_log || []}
        //                     pagination={false}
        //                     rowKey={(row, index) => index}
        //                 />
        //             )}
        //         >
        //             <Button size="small" icon={<FaEye />} />
        //         </Popover>
        //     )
        // },
        {
            title: "Umumiy sotuv (so'mda)",
            dataIndex: "cars",
            render: (cars) => {
                const totalSum = cars.reduce((acc, car) => {
                    const carSales = car.sales || [];
                    const carTotal = carSales.reduce((sum, sale) => {
                        const price = sale.total_price;
                        const converted = sale.currency === 'usd' ? price * usdRate : price;
                        return sum + converted;
                    }, 0);
                    return acc + carTotal;
                }, 0);
                return totalSum.toLocaleString();
            },
        },
        // {
        //     title: "To'langan summa (so'mda)",
        //     dataIndex: "payment_log",
        //     render: (payments) => {
        //         const totalPayments = payments.reduce((sum, p) => {
        //             const converted = p.currency === 'usd' ? p.amount * usdRate : p.amount;
        //             return sum + converted;
        //         }, 0);
        //         return totalPayments.toLocaleString();
        //     },
        // }
    ];

    return (
        <Modal open={visible} onCancel={onClose} footer={null} width={700} title="Ustalar ro'yxati">
            <Table
                dataSource={masters}
                columns={masterColumns}
                rowKey={(record) => record._id}
                pagination={false}
                expandable={{
                    expandedRowRender: (record) => (
                        <Table
                            columns={carColumns(record.cars)}
                            dataSource={record.cars.map((car, i) => ({ ...car, master_id: record._id }))}
                            rowKey="_id"
                            pagination={false}
                            size="small"
                        />
                    )

                }}
            />
        </Modal>
    );
};

export default MastersModal;
