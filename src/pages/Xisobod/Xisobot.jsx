import React, { useEffect, useState } from "react";
import { useGetBudgetQuery } from "../../context/service/budget.service";
import "./xisobot.css";
import { useGetAllProductsQuery } from "../../context/service/addproduct.service";
import { useGetDebtorsQuery } from "../../context/service/debtor.service";
import { useGetStoreProductsQuery } from "../../context/service/store.service";
import { useGetExpensesQuery } from "../../context/service/harajatlar.service";
import { useGetSalesHistoryQuery } from "../../context/service/sale.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { DatePicker } from "antd";

const { RangePicker } = DatePicker;

export default function Xisobot() {
  const { data: budgetData } = useGetBudgetQuery();
  const { data: saleData } = useGetSalesHistoryQuery();
  const { data: skladData } = useGetAllProductsQuery();
  const { data: storeData } = useGetStoreProductsQuery();
  const { data: debtData, isLoading: debtLoading } = useGetDebtorsQuery();
  const { data: harajatData } = useGetExpensesQuery();
  const { data: usdRate } = useGetUsdRateQuery();

  const [selectedRange, setSelectedRange] = useState([]);
  const [umumiyDebt, setUmumiyDebt] = useState(0); // USD qarzdorlik
  const [umumiyDebtUzs, setUmumiyDebtUzs] = useState(0); // So'm qarzdorlik
  const [umumiySaleSum, setUmumiySaleSum] = useState(0); // So'mdagi sotuv summasi
  const [umumiySaleUsd, setUmumiySaleUsd] = useState(0); // USDdagi sotuv summasi
  const [umumiyFoydaSum, setUmumiyFoydaSum] = useState(0); // So'mdagi foyda
  const [umumiyFoydaUsd, setUmumiyFoydaUsd] = useState(0); // USDdagi foyda
  const [umumiySklad, setUmumiySklad] = useState(0);
  const [umumiyStore, setUmumiyStore] = useState(0);
  const [umumiyHarajat, setUmumiyHarajat] = useState(0);
  const [umumiyAstatka, setUmumiyAstatka] = useState(0);
  const [umumiyAstatkaUzs, setUmumiyAstatkaUzs] = useState(0); // So'm astatka

  const currentRate = usdRate?.rate || 13000; // Joriy kurs

  const handleDateChange = (dates) => {
    if (!dates || dates.length === 0) {
      setSelectedRange([]);
      return;
    }
    setSelectedRange(dates);
  };

  useEffect(() => {
    if (!debtData || debtLoading) {
      setUmumiyDebt(0);
      setUmumiyDebtUzs(0);
      return;
    }

    const startDate = selectedRange[0] ? selectedRange[0].startOf("day") : null;
    const endDate = selectedRange[1] ? selectedRange[1].endOf("day") : null;

    // Qarzdorlikni hisoblash (USD va So'm)
    const filteredUsdDebt = debtData.filter((item) => {
      const itemDate = new Date(item.createdAt);
      const currency = item.currency ? item.currency.toLowerCase() : "usd";
      return (
        (startDate ? itemDate >= startDate : true) &&
        currency === "usd" &&
        (endDate ? itemDate <= endDate : true)
      );
    });
    const filteredUzsDebt = debtData.filter((item) => {
      const itemDate = new Date(item.createdAt);
      const currency = item.currency ? item.currency.toLowerCase() : "sum";
      return (
        (startDate ? itemDate >= startDate : true) &&
        currency === "sum" &&
        (endDate ? itemDate <= endDate : true)
      );
    });

    const usdDebt = filteredUsdDebt.reduce(
      (a, b) => a + (b.debt_amount || 0),
      0
    );
    const uzsDebt = filteredUzsDebt.reduce(
      (a, b) => a + (b.debt_amount || 0),
      0
    );

    setUmumiyDebt(usdDebt);
    setUmumiyDebtUzs(uzsDebt);

    // Sotuv summasini hisoblash (So'm va USD)
    const filteredSalesSum = saleData?.filter(
      (item) =>
        (startDate ? new Date(item.createdAt) >= startDate : true) &&
        (item.currency ? item.currency.toLowerCase() : "sum") === "sum" &&
        (endDate ? new Date(item.createdAt) <= endDate : true)
    );
    const filteredSalesUsd = saleData?.filter(
      (item) =>
        (startDate ? new Date(item.createdAt) >= startDate : true) &&
        (item.currency ? item.currency.toLowerCase() : "usd") === "usd" &&
        (endDate ? new Date(item.createdAt) <= endDate : true)
    );

    const totalSaleSum =
      filteredSalesSum?.reduce((a, b) => a + (b?.total_price || 0), 0) || 0;
    const totalSaleUsd =
      filteredSalesUsd?.reduce((a, b) => a + (b?.total_price || 0), 0) || 0;

    setUmumiySaleSum(totalSaleSum);
    setUmumiySaleUsd(totalSaleUsd);

    // Sotuvlardan foydani hisoblash (So'm)
    const totalProfitSum =
      filteredSalesSum?.reduce((a, b) => {
        const sellPrice = b?.sell_price || 0;
        const buyPrice = b?.buy_price || 0;
        const quantity = b?.quantity || 0;
        const purchaseCurrency = b?.product_id?.purchase_currency || "sum";
        const saleUsdRate = b?.usd_rate || currentRate;

        const convertedBuyPrice =
          purchaseCurrency === "usd" ? buyPrice * saleUsdRate : buyPrice;
        const profit = (sellPrice - convertedBuyPrice) * quantity;
        return a + profit;
      }, 0) || 0;

    // Sotuvlardan foydani hisoblash (USD)
    const totalProfitUsd =
      filteredSalesUsd?.reduce((a, b) => {
        const sellPrice = b?.sell_price || 0;
        const buyPrice = b?.buy_price || 0;
        const quantity = b?.quantity || 0;
        const purchaseCurrency = b?.product_id?.purchase_currency || "usd";
        const saleUsdRate = b?.usd_rate || currentRate;

        const convertedBuyPrice =
          purchaseCurrency === "sum" ? buyPrice / saleUsdRate : buyPrice;
        const profit = (sellPrice - convertedBuyPrice) * quantity;
        return a + profit;
      }, 0) || 0;

    // Sklad foydasini hisoblash (So'm)
    setUmumiySklad(
      skladData?.reduce(
        (a, b) =>
          a +
          (b?.stock || 0) *
            ((b?.sell_price || 0) - (b?.purchase_price || 0)) *
            (b?.sell_currency === "usd" ? currentRate : 1),
        0
      ) || 0
    );

    // Do'kon foydasini hisoblash (So'm)
    setUmumiyStore(
      storeData?.reduce(
        (a, b) =>
          a +
          (b?.quantity || 0) *
            ((b?.product_id?.sell_price || 0) -
              (b?.product_id?.purchase_price || 0)) *
            (b?.product_id?.sell_currency === "usd" ? currentRate : 1),
        0
      ) || 0
    );

    // Harajatni hisoblash (So'm)
    const totalExpenses =
      harajatData
        ?.filter(
          (item) =>
            (startDate ? new Date(item.created_at) >= startDate : true) &&
            (endDate ? new Date(item.created_at) <= endDate : true)
        )
        ?.reduce((a, b) => a + (b?.payment_summ || 0), 0) || 0;

    setUmumiyHarajat(totalExpenses);

    // Umumiy foyda (So'm va USD)
    const calculatedProfitSum = totalProfitSum - totalExpenses;
    setUmumiyFoydaSum(calculatedProfitSum < 0 ? 0 : calculatedProfitSum);
    setUmumiyFoydaUsd(totalProfitUsd < 0 ? 0 : totalProfitUsd);

    // Astatkani hisoblash (USD va So'm)
    const isUsdCurrency = (currency) => {
      const normalizedCurrency = (currency || "sum").toLowerCase();
      return ["usd", "dollar", "us dollar"].includes(normalizedCurrency);
    };

    const astatkaUsd =
      (skladData
        ?.filter((sd) => isUsdCurrency(sd.sell_currency))
        .reduce((a, b) => a + (b?.stock || 0) * (b?.purchase_price || 0), 0) ||
        0) +
      (storeData
        ?.filter((sd) => isUsdCurrency(sd?.product_id?.sell_currency))
        .reduce(
          (a, b) =>
            a + (b?.quantity || 0) * (b?.product_id?.purchase_price || 0),
          0
        ) || 0);

    const astatkaUzs =
      (skladData
        ?.filter((sd) => !isUsdCurrency(sd.sell_currency))
        .reduce((a, b) => a + (b?.stock || 0) * (b?.purchase_price || 0), 0) ||
        0) +
      (storeData
        ?.filter((sd) => !isUsdCurrency(sd?.product_id?.sell_currency))
        .reduce(
          (a, b) =>
            a + (b?.quantity || 0) * (b?.product_id?.purchase_price || 0),
          0
        ) || 0);

    setUmumiyAstatka(astatkaUsd);
    setUmumiyAstatkaUzs(astatkaUzs);

    // Debug loglari
    console.log("Sklad Data:", skladData);
    console.log("Store Data:", storeData);
    console.log(
      "Sklad USD Astatka:",
      skladData
        ?.filter((sd) => isUsdCurrency(sd.sell_currency))
        .reduce((a, b) => a + (b?.stock || 0) * (b?.purchase_price || 0), 0) ||
        0
    );
    console.log(
      "Store USD Astatka:",
      storeData
        ?.filter((sd) => isUsdCurrency(sd?.product_id?.sell_currency))
        .reduce(
          (a, b) =>
            a + (b?.quantity || 0) * (b?.product_id?.purchase_price || 0),
          0
        ) || 0
    );
  }, [
    debtData,
    saleData,
    skladData,
    storeData,
    harajatData,
    selectedRange,
    usdRate,
    debtLoading,
  ]);

  // Raqamlarni formatlash funksiyasi (tiyinsiz)
  const formatNumber = (num) => {
    return num.toLocaleString("uz-UZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div style={{ height: "calc(100vh - 200px)", paddingInline: "12px" }}>
      <div style={{ marginBottom: "20px" }}>
        <RangePicker
          onChange={handleDateChange}
          format="YYYY-MM-DD"
          style={{ width: "100%" }}
        />
      </div>

      {debtLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="hisobot_container">
          <div className="hisobot_card">
            <p style={{ color: "#000" }}>Umumiy sotuv summasi (So'm)</p>
            <b style={{ color: "#000" }}>{formatNumber(umumiySaleSum)} UZS</b>
          </div>
          <div className="hisobot_card">
            <p style={{ color: "#000" }}>Umumiy sotuv summasi (USD)</p>
            <b style={{ color: "#000" }}>{formatNumber(umumiySaleUsd)}$</b>
          </div>
          <div className="hisobot_card">
            <p style={{ color: "#000" }}>Umumiy foyda (So'm)</p>
            <b style={{ color: "#000" }}>{formatNumber(umumiyFoydaSum)} UZS</b>
          </div>
          <div className="hisobot_card">
            <p style={{ color: "#000" }}>Umumiy foyda (USD)</p>
            <b style={{ color: "#000" }}>{formatNumber(umumiyFoydaUsd)}$</b>
          </div>
          <div className="hisobot_card">
            <p style={{ color: "#000" }}>Umumiy qarzdorlik (So'm)</p>
            <b style={{ color: "#000" }}>{formatNumber(umumiyDebtUzs)} UZS</b>
          </div>
          <div className="hisobot_card">
            <p style={{ color: "#000" }}>Umumiy harajat</p>
            <b style={{ color: "#000" }}>{formatNumber(umumiyHarajat)} UZS</b>
          </div>

          <div className="hisobot_card">
            <p style={{ color: "#000" }}>
              Sklad va Do'kon - umumiy astatka (So'm)
            </p>
            <b style={{ color: "#000" }}>
              {" "}
              {formatNumber(umumiyAstatkaUzs)} So'm
            </b>
          </div>
        </div>
      )}
    </div>
  );
}
// d
