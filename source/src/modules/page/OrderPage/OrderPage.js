/* eslint-disable indent */
import React, { useEffect, useRef, useState } from 'react';
import './OrderPage.scss';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
// import { fetchAsyncProductSingle, getProductSingle, getSingleProductStatus } from '../../store/productSlice';
import { formatPrice } from '../../../utils/helpers';
// import { addToCart, getCartMessageStatus, setCartMessageOff, setCartMessageOn } from '../../store/cartSlice';
// import CartMessage from '../../components/CartMessage/CartMessage';
import Loading from '@components/common/loading';
import apiConfig from '@constants/apiConfig';
import useFetch from '@hooks/useFetch';
import { formatMoney } from '@utils';
import { IconEdit, IconEditCircle, IconEditCircleOff, IconMinus, IconPlus, IconPlusMinus } from '@tabler/icons-react';
import {
    Button,
    Checkbox,
    Divider,
    Form,
    Input,
    Result,
    Space,
    Steps,
    Table,
    Tag,
    Typography,
    message,
    theme,
} from 'antd';
import axios from 'axios';
import ListDetailsForm from './ListDetailsForm';
import useDisclosure from '@hooks/useDisclosure';
import PageWrapper from '@components/common/layout/PageWrapper';
import routes from '@routes';
import { LoadingOutlined, SmileOutlined, SolutionOutlined, UserOutlined } from '@ant-design/icons';
import { IconLoader } from '@tabler/icons-react';
import { defineMessage } from 'react-intl';
import AutoCompleteField from '@components/common/form/AutoCompleteField';
import SelectField from '@components/common/form/SelectField';
import { paymentOptions } from '@constants/masterData';
import useAuth from '@hooks/useAuth';
import { showErrorMessage, showSucsessMessage } from '@services/notifyService';
import useTranslate from '@hooks/useTranslate';
import { paymentSelect } from '@constants';
const { Text } = Typography;
let index = 0;

const decription = defineMessage({
    first: 'Kiểm tra số lượng sản phẩm',
    second: 'Thanh toán đơn hàng',
    third: 'Hoàn thành các bước',
});

const OrderPage = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const queryParameters = new URLSearchParams(window.location.search);
    const [openedDetailsModal, handlerDetailsModal] = useDisclosure(false);
    const [form] = Form.useForm();
    const translate = useTranslate();
    const [item1, setItem1] = useState(null);
    const [orderId, setOrderId] = useState(0);
    const renderTitle = (title, item) => (
        <span>
            {title}
            <a
                style={{
                    float: 'right',
                }}
                onClick={() => handleEdit(item)}
            >
                <IconEdit size={17} />
            </a>
        </span>
    );

    const handleEdit = (item) => {
        console.log(item);
        setItem1(item);
        handlerDetailsModal.open();
    };
    const renderItem = (title) => ({
        value: title,
        label: (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                {title}
                <span>
                    <IconEdit />
                </span>
            </div>
        ),
    });

    const { token } = theme.useToken();
    const [current, setCurrent] = useState(0);
    const next = () => {
        setCurrent(current + 1);
    };
    const prev = () => {
        setCurrent(current - 1);
    };
    const {
        data: cartItem,
        loading: allproductsLoading,
        execute: executgeallproducts,
    } = useFetch(apiConfig.cart.getList, {
        immediate: true,
        mappingData: ({ data }) => data.cartDetailDtos,
    });

    const { data: order, execute: createOrderForUser } = useFetch({
        ...apiConfig.order.createForUser,
    });

    const { execute: createTransaction } = useFetch({
        ...apiConfig.transaction.create,
    });

    function onConfirmOrder(values) {
        let array2 = new Array(cartItem.length).fill(null);

        array2 = cartItem.map((item) => ({
            color: item.color,
            price: item.price,
            productName: item.productName,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
        }));
        const updatedValues = {
            ...values,
            listOrderProduct: array2, // Thay yourListOrderProductArray bằng mảng thực tế của bạn
        };
        createOrderForUser({
            data: { ...updatedValues },
            onCompleted: (respone) => {
                console.log(respone.data.orderId);
                if (values.paymentMethod === 1) {
                    createTransaction({
                        data: {
                            orderId: respone.data.orderId,
                            urlCancel: 'http://localhost:3000/my-order-fail',
                            urlSuccess: 'http://localhost:3000/my-order-success',
                        },
                        onCompleted: (res) => {
                            console.log(res.data);
                            window.location.href = res.data;
                            showSucsessMessage('Đơn hàng đang được xử lý!');
                        },
                        onError: () => {
                            showErrorMessage(translate.formatMessage('Thanh toán thất bại!'));
                            form.resetFields();
                        },
                    });
                } else {
                    showSucsessMessage('Đặt hàng thành công');
                    setCurrent(2);
                }
            },
            onError: (error) => {
                showErrorMessage('Đặt hàng thất bại');
                console.log(error);
            },
        });
        console.log(updatedValues);
        // message.success('Đặt hàng thành công');
    }
    const [loadings, setLoadings] = useState([]);
    const enterLoading = (index) => {
        setLoadings((prevLoadings) => {
            const newLoadings = [...prevLoadings];
            newLoadings[index] = true;
            return newLoadings;
        });
        setTimeout(() => {
            setLoadings((prevLoadings) => {
                const newLoadings = [...prevLoadings];
                newLoadings[index] = false;
                return newLoadings;
            });
        }, 4000);
    };
    const steps = [
        {
            title: 'Đơn hàng',
            status: 'finish',
            // icon: <SolutionOutlined />,
            content: (
                <Table
                    pagination={false}
                    columns={[
                        {
                            title: 'Tên sản phẩm',
                            dataIndex: ['productName'],
                            align: 'center',
                        },
                        {
                            title: 'Màu sắc',
                            dataIndex: ['color'],
                            align: 'center',
                        },
                        {
                            title: 'Giá',
                            dataIndex: ['price'],
                            name: 'price',
                            align: 'center',
                            render: (value) => {
                                return (
                                    <span>
                                        {formatMoney(value, {
                                            groupSeparator: ',',
                                            decimalSeparator: '.',
                                            currentcy: 'đ',
                                            currentcyPosition: 'BACK',
                                            currentDecimal: '0',
                                        })}
                                    </span>
                                );
                            },
                        },
                        {
                            title: 'Số lượng',
                            dataIndex: 'quantity',
                            align: 'center',
                        },
                        {
                            title: 'Tổng',
                            dataIndex: 'totalPriceSell',
                            render: (value) => {
                                return (
                                    <>
                                        {formatMoney(value, {
                                            groupSeparator: ',',
                                            decimalSeparator: '.',
                                            currentcy: 'đ',
                                            currentcyPosition: 'BACK',
                                            currentDecimal: '0',
                                        })}
                                    </>
                                );
                            },
                        },
                    ]}
                    dataSource={cartItem}
                    bordered
                    summary={(data) => {
                        const total = data.reduce((pre, current) => {
                            return pre + current.totalPriceSell;
                        }, 0);
                        return (
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={4} align="end">
                                    <Tag color={'green'} style={{ fontSize: 18, fontWeight: 700 }}>
                                        Tổng trả
                                    </Tag>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>
                                    <Text type="danger" style={{ fontWeight: 700 }}>
                                        {formatMoney(total, {
                                            groupSeparator: ',',
                                            decimalSeparator: '.',
                                            currentcy: 'đ',
                                            currentcyPosition: 'BACK',
                                            currentDecimal: '0',
                                        })}
                                    </Text>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        );
                    }}
                ></Table>
            ),
            decription: decription.first,
        },
        {
            title: 'Thanh toán',
            // status: 'process',
            // icon: <LoadingOutlined />,
            content: (
                <Form
                    onFinish={onConfirmOrder}
                    labelCol={{
                        span: 7,
                    }}
                    wrapperCol={{
                        span: 18,
                    }}
                    layout="horizontal"
                    style={{
                        maxWidth: 900,
                        marginTop: 20,
                    }}
                    initialValues={{
                        receiver: profile?.fullName,
                        email: profile?.email,
                        address: profile?.address,
                        phone: profile?.phone,
                    }}
                >
                    <Form.Item
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng điền tên',
                            },
                        ]}
                        label="Họ và tên"
                        name="receiver"
                        contentWrapperStyle={{ width: 200 }}
                    >
                        <Input placeholder="Nhập tên ..." />
                    </Form.Item>
                    <Form.Item
                        rules={[
                            {
                                required: true,
                                type: 'email',
                                message: 'Vui lòng điền email',
                            },
                        ]}
                        label="Email"
                        name="email"
                    >
                        <Input placeholder="Nhập email ..." />
                    </Form.Item>
                    <Form.Item
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng điền số điện thoại',
                            },
                        ]}
                        label="Số điện thoại"
                        name="phone"
                    >
                        <Input placeholder="Nhập số điện thoại ..." />
                    </Form.Item>

                    <Form.Item label="Ghi chú" name="note">
                        <Input placeholder="Nhập ghi chú ..." />
                    </Form.Item>
                    <Form.Item labelAlign="right" label="Mã giảm giá" name="voucherId">
                        <Input placeholder="Nhập mã giảm giá ..." />
                    </Form.Item>
                    <AutoCompleteField
                        label="Địa chỉ"
                        name="addressId"
                        apiConfig={apiConfig.address.getList}
                        required
                        dropdownRender={(menu) => (
                            <>
                                {menu}
                                <Divider
                                    style={{
                                        margin: '8px 0',
                                    }}
                                />
                                <Space
                                    style={{
                                        padding: '0 8px 4px',
                                        justifyContent: 'center',
                                        justifyItems: 'center',
                                    }}
                                >
                                    {/* <Input
                                        placeholder="Please enter item"
                                        ref={inputRef}
                                        value={name}
                                        onChange={onNameChange}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    /> */}
                                    <Button
                                        type="text"
                                        icon={<IconPlus size={10} />}
                                        onClick={() => {
                                            setItem1(null);
                                            handlerDetailsModal.open();
                                        }}
                                    >
                                        Thêm địa chỉ giao hàng
                                    </Button>
                                </Space>
                            </>
                        )}
                        mappingOptions={(item) => ({ value: item.id, label: renderTitle(item.address, item) })}
                    />

                    <SelectField
                        name="paymentMethod"
                        label="Hình thức thanh toán"
                        allowClear={false}
                        options={paymentSelect}
                        required
                    />
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loadings[0]}
                        onClick={() => enterLoading(0)}
                        style={{ marginBottom: 20 }}
                    >
                        Xác nhận đặt hàng
                    </Button>
                </Form>
            ),
            decription: decription.second,
        },
        {
            title: 'Hoàn thành',
            // status: 'wait',
            // icon: <SmileOutlined />,
            content: (
                <Result
                    status="success"
                    title="Đơn hàng của bạn đang được xử lý!"
                    subTitle="Vui lòng theo dõi email để biết quá trình giao hàng."
                    extra={[
                        <Button type="primary" key="console">
                            <a href="/">Quay về trang chủ</a>
                        </Button>,
                        <Button key="buy">
                            <a href="/all-product">Xem sản phẩm khác</a>
                        </Button>,
                    ]}
                />
            ),
            decription: decription.third,
        },
    ];
    const items = steps.map((item) => ({
        key: item.title,
        title: item.title,
        icon: item.icon,
        status: item.status,
    }));
    const contentStyle = {
        lineHeight: '260px',
        textAlign: 'center',
        color: token.colorTextTertiary,
        backgroundColor: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
        border: `1px dashed ${token.colorBorder}`,
        marginTop: 16,
        width: 1100,
    };

    const [quantity, setQuantity] = useState(1);

    // getting single product
    // useEffect(() => {
    //     dispatch(fetchAsyncProductSingle(id));

    //     if (cartMessageStatus) {
    //         setTimeout(() => {
    //             dispatch(setCartMessageOff());
    //         }, 2000);
    //     }
    // }, [cartMessageStatus]);

    return (
        <div className="con1 py-4 bg-whitesmoke" style={{ display: 'flex', justifyContent: 'start', marginLeft: 200 }}>
            <ListDetailsForm
                open={openedDetailsModal}
                onCancel={() => handlerDetailsModal.close()}
                form={form}
                data={item1}
                isEditing={!!item1}
            />
            <PageWrapper
                routes={[
                    {
                        breadcrumbName: 'Trang chủ',
                        path: generatePath(routes.homePage.path),
                    },
                    { breadcrumbName: 'Đặt hàng' },
                ]}
                // title={title}
            >
                <Steps current={current} items={items} size="large" />
                <div style={contentStyle}>{steps[current].content}</div>
                <div
                    style={{
                        marginTop: 24,
                    }}
                >
                    {current < steps.length - 2 && (
                        <Button type="primary" onClick={() => next()}>
                            Next
                        </Button>
                    )}
                </div>
            </PageWrapper>
        </div>
    );
};

export default OrderPage;
