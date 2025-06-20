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

  const currentRate = usdRateData?.rate || 12500;

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

  // Valyuta tekshirish funksiyasi
  const isUsdCurrency = (currency) => {
    const normalizedCurrency = (currency || "sum").toLowerCase();
    return ["usd", "dollar", "us dollar"].includes(normalizedCurrency);
  };

  // Foyda hisoblash funksiyasi
  const calculateProfit = (sale) => {
    const sellPrice = sale.sell_price || 0;
    const buyPrice = sale.buy_price || 0;
    const quantity = sale.quantity || 0;
    const purchaseCurrency =
      sale.product_id?.purchase_currency || sale.currency;
    const saleUsdRate = sale.usd_rate || currentRate;

    if (isUsdCurrency(sale.currency)) {
      // USD da sotilgan
      const convertedBuyPrice = !isUsdCurrency(purchaseCurrency)
        ? buyPrice / saleUsdRate
        : buyPrice;
      return (sellPrice - convertedBuyPrice) * quantity;
    } else {
      // So'mda sotilgan
      const convertedBuyPrice = isUsdCurrency(purchaseCurrency)
        ? buyPrice * saleUsdRate
        : buyPrice;
      return (sellPrice - convertedBuyPrice) * quantity;
    }
  };

  // Narxni number formatga o'zgartirish funksiyasi (mingliklar bo'yicha ajratish)
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  // Narxni formatlash funksiyasi (valyuta belgisi qo'shish)
  const formatPrice = (price, currency) => {
    const formatted = formatNumber(price);
    return `${formatted} ${currency === "sum" ? "so'm" : "$"}`;
  };

  // Umumiy, haftalik va kunlik summalarni hisoblash
  const calculateStats = (data, currency) => {
    const filteredData =
      data?.filter((item) => item.currency === currency) || [];

    const total = filteredData.reduce((acc, sale) => acc + sale.total_price, 0);
    const totalProfit = filteredData.reduce(
      (acc, sale) => acc + Math.max(0, calculateProfit(sale)),
      0
    );

    const weeklyData = filteredData.filter(
      (sale) =>
        new Date(sale.createdAt) >=
        new Date(new Date().setDate(new Date().getDate() - 7))
    );
    const weekly = weeklyData.reduce((acc, sale) => acc + sale.total_price, 0);
    const weeklyProfit = weeklyData.reduce(
      (acc, sale) => acc + Math.max(0, calculateProfit(sale)),
      0
    );

    const dailyData = filteredData.filter(
      (sale) =>
        new Date(sale.createdAt).toLocaleDateString() ===
        new Date().toLocaleDateString()
    );
    const daily = dailyData.reduce((acc, sale) => acc + sale.total_price, 0);
    const dailyProfit = dailyData.reduce(
      (acc, sale) => acc + Math.max(0, calculateProfit(sale)),
      0
    );

    return {
      total,
      weekly,
      daily,
      totalProfit,
      weeklyProfit,
      dailyProfit,
    };
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
      title: "Foyda",
      key: "profit",
      render: (text, record) => {
        const profit = calculateProfit(record);
        const profitColor = profit >= 0 ? "#52c41a" : "#ff4d4f";
        return (
          <span style={{ color: profitColor, fontWeight: "bold" }}>
            {formatPrice(Math.abs(profit), record.currency)}
            {profit < 0 && " (zarar)"}
          </span>
        );
      },
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
      render: (text) => new Date(text).toLocaleDateString(),
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

      {/* Sotuv statistikalari */}
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

      {/* Foyda statistikalari (So'm) */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Umumiy foyda (so'm)"
            value={formatPrice(sumStats.totalProfit, "sum")}
            valueStyle={{
              color: sumStats.totalProfit >= 0 ? "#52c41a" : "#ff4d4f",
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Haftalik foyda (so'm)"
            value={formatPrice(sumStats.weeklyProfit, "sum")}
            valueStyle={{
              color: sumStats.weeklyProfit >= 0 ? "#52c41a" : "#ff4d4f",
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Kunlik foyda (so'm)"
            value={formatPrice(sumStats.dailyProfit, "sum")}
            valueStyle={{
              color: sumStats.dailyProfit >= 0 ? "#52c41a" : "#ff4d4f",
            }}
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

      {/* Foyda statistikalari (USD) */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Umumiy foyda ($)"
            value={formatPrice(usdStats.totalProfit, "usd")}
            valueStyle={{
              color: usdStats.totalProfit >= 0 ? "#52c41a" : "#ff4d4f",
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Haftalik foyda ($)"
            value={formatPrice(usdStats.weeklyProfit, "usd")}
            valueStyle={{
              color: usdStats.weeklyProfit >= 0 ? "#52c41a" : "#ff4d4f",
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Kunlik foyda ($)"
            value={formatPrice(usdStats.dailyProfit, "usd")}
            valueStyle={{
              color: usdStats.dailyProfit >= 0 ? "#52c41a" : "#ff4d4f",
            }}
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
        summary={() => {
          const totalProfit = filteredSales.reduce((sum, sale) => {
            return sum + calculateProfit(sale);
          }, 0);

          return (
            <Table.Summary.Row>
              <Table.Summary.Cell colSpan={5} align="right">
                <strong>Jami foyda:</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell>
                <strong
                  style={{
                    color: totalProfit >= 0 ? "#52c41a" : "#ff4d4f",
                  }}
                >
                  {formatNumber(Math.abs(totalProfit))}
                  {totalProfit < 0 && " (zarar)"}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell colSpan={2}></Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </Card>
  );
}
