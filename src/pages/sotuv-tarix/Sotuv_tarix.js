import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  DatePicker,
  Select,
  Statistic,
  Row,
  Col,
  Button,
} from "antd";
import { useGetSalesHistoryQuery } from "../../context/service/sale.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function SotuvTarix() {
  const { data: sales, isLoading } = useGetSalesHistoryQuery();
  const { data: usdRateData } = useGetUsdRateQuery();

  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currency, setCurrency] = useState("");

  // Sana intervali o'zgarganda
  const onDateChange = (dates) => {
    setSelectedDateRange(dates);
    filterSales(dates, paymentMethod, currency);
  };

  // To'lov usuli tanlanganda
  const onPaymentMethodChange = (value) => {
    setPaymentMethod(value);
    filterSales(selectedDateRange, value, currency);
  };

  // Valyuta tanlanganda
  const onCurrencyChange = (value) => {
    setCurrency(value);
    filterSales(selectedDateRange, paymentMethod, value);
  };

  // Filtrlash funksiyasi
  const filterSales = (dates, payment, currency) => {
    let filtered = sales || [];
    if (dates && dates[0] && dates[1]) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= dates[0] && saleDate <= dates[1];
      });
    }
    if (payment) {
      filtered = filtered.filter((sale) => sale.payment_method === payment);
    }
    if (currency) {
      filtered = filtered.filter((f) => f.currency === currency);
    }
    setFilteredSales(filtered);
  };

  // Narxni number formatga o'zgartirish funksiyasi (mingliklar bo'yicha ajratish)
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  // Narxni formatlash funksiyasi (valyuta belgisi qo'shish)
  const formatPrice = (price, currency) => {
    const formatted = formatNumber(price);
    return `${formatted} ${currency === "sum" ? "so'm" : "$"}`;
  };

  // Umumiy, haftalik va kunlik summalarni hisoblash
  const calculateStats = (data, currency) => {
    const total =
      data
        ?.filter((item) => item.currency === currency)
        ?.reduce((acc, sale) => acc + sale.total_price, 0) || 0;

    const weekly =
      data
        ?.filter((item) => item.currency === currency)
        ?.filter(
          (sale) =>
            new Date(sale.createdAt) >=
            new Date(new Date().setDate(new Date().getDate() - 7))
        )
        .reduce((acc, sale) => acc + sale.total_price, 0) || 0;

    const daily =
      data
        ?.filter((item) => item.currency === currency)
        ?.filter(
          (sale) =>
            new Date(sale.createdAt).toLocaleDateString() ===
            new Date().toLocaleDateString()
        )
        .reduce((acc, sale) => acc + sale.total_price, 0) || 0;

    return { total, weekly, daily };
  };

  const sumStats = calculateStats(filteredSales, "sum");
  const usdStats = calculateStats(filteredSales, "usd");

  // Dastlabki ma'lumotlarni to'ldirish
  useEffect(() => {
    setFilteredSales(sales || []);
  }, [sales]);

  // Bir kunlik savdo tarixini ko'rsatish
  const showDailySales = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    filterSales([startOfDay, endOfDay], paymentMethod, currency);
  };

  // Jadval ustunlari
  const columns = [
    {
      title: "Mahsulot nomi",
      dataIndex: "product_name",
      key: "product_name",
    },
    {
      title: "Model",
      dataIndex: ["product_id", "model"],
      key: "model",
      render: (text) => text || "-",
    },
    {
      title: "Valyuta",
      dataIndex: "currency",
      key: "currency",
    },
    {
      title: "Soni",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Umumiy narxi",
      dataIndex: "total_price",
      key: "total_price",
      render: (text, record) => formatPrice(text, record.currency),
    },
    {
      title: "To'lov usuli",
      dataIndex: "payment_method",
      key: "payment_method",
    },
    {
      title: "Sotilgan sana",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleDateString(), // Faqat sanani ko'rsatish
    },
  ];

  return (
    <Card
      title="Sotuvlar tarixi"
      bordered={false}
      style={{ margin: 20, width: "100%" }}
    >
      <div style={{ marginBottom: 20 }}>
        <RangePicker onChange={onDateChange} style={{ marginRight: 20 }} />
        <Select
          placeholder="To'lov usulini tanlang"
          onChange={onPaymentMethodChange}
          style={{ width: 200, marginRight: 20 }}
        >
          <Option value="">Barchasi</Option>
          <Option value="naqd">Naqd</Option>
          <Option value="plastik">Karta</Option>
        </Select>
        <Select
          placeholder="Valyutani tanlang"
          value={currency}
          onChange={onCurrencyChange}
          style={{ width: 200, marginRight: 20 }}
        >
          <Option value="">Barchasi</Option>
          <Option value="sum">So'm</Option>
          <Option value="usd">USD</Option>
        </Select>
        <Button type="primary" onClick={showDailySales}>
          Bir kunlik savdo
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Umumiy summa (so'm)"
            value={formatPrice(sumStats.total, "sum")}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Haftalik summa (so'm)"
            value={formatPrice(sumStats.weekly, "sum")}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Kunlik summa (so'm)"
            value={formatPrice(sumStats.daily, "sum")}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Umumiy summa ($)"
            value={formatPrice(usdStats.total, "usd")}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Haftalik summa ($)"
            value={formatPrice(usdStats.weekly, "usd")}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Kunlik summa ($)"
            value={formatPrice(usdStats.daily, "usd")}
          />
        </Col>
      </Row>

      <Table
        dataSource={filteredSales}
        loading={isLoading}
        style={{ width: "100%" }}
        columns={columns}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell colSpan={5} align="right"></Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
}
