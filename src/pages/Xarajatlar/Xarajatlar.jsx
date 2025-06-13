import React, { useState, useEffect } from "react";
import { Button, Form, Input, Modal, Card, Row, Col, message } from "antd";
import {
  useGetExpensesQuery,
  useAddExpenseMutation,
} from "../../context/service/harajatlar.service";
import {
  useGetBudgetQuery,
  useUpdateBudgetMutation,
} from "../../context/service/budget.service";

export default function Xarajatlar() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const { data: budgetData } = useGetBudgetQuery();
  const [updateBudget] = useUpdateBudgetMutation();
  const { data: expensesData, isLoading } = useGetExpensesQuery();
  const [addExpense, { isLoading: isAddLoading }] = useAddExpenseMutation();

  useEffect(() => {
    if (expensesData) {
      setExpenses(expensesData);
    }
  }, [expensesData]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleFinish = async (values) => {
    try {
      const response = await addExpense(values).unwrap();
      await updateBudget(Number(values.payment_summ)).unwrap();
      setExpenses([...expenses, values]);
      form.resetFields();
      message.success(response.message);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Xatolik:", error);
      message.error("Xarajatni qo'shishda xatolik yuz berdi.");
    }
  };

  // Guruhlash: staff_name bo‘yicha xarajatlarni ajratish
  const groupedExpenses = expenses.reduce((acc, item) => {
    if (!acc[item.staff_name]) acc[item.staff_name] = [];
    acc[item.staff_name].push(item);
    return acc;
  }, {});

  return (
    <div>
      <Button
        type="primary"
        onClick={showModal}
        style={{ marginBottom: "10px" }}
      >
        Xarajat Qo'shish
      </Button>

      <Modal
        title="Xarajat Qo'shish"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item
            label="Xarajat summasi"
            name="payment_summ"
            rules={[{ required: true, message: "Xarajat summasini kiriting!" }]}
          >
            <Input type="number" placeholder="Xarajat summasi" />
          </Form.Item>
          <Form.Item
            label="Xarajat sababi"
            name="comment"
            rules={[{ required: true, message: "Xarajat sababini kiriting!" }]}
          >
            <Input.TextArea placeholder="Xarajat sababi" />
          </Form.Item>
          <Form.Item
            label="Xodim ismi"
            name="staff_name"
            rules={[{ required: true, message: "Xodim ismini kiriting!" }]}
          >
            <Input placeholder="Xodim ismi" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isAddLoading}>
              Qo'shish
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Row gutter={[16, 16]}>
        {Object.entries(groupedExpenses).map(([staffName, staffExpenses]) => {
          const totalSum = staffExpenses.reduce((acc, curr) => acc + Number(curr.payment_summ), 0);
          return (
            <Col xs={24} md={12} lg={8} key={staffName}>
              <Card title={staffName} bordered>
                <p><strong>Umumiy xarajat:</strong> {totalSum.toLocaleString()}</p>
                <div>
                  {staffExpenses.map((item, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <strong>{item.payment_summ.toLocaleString()} </strong> — {item.comment}
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
