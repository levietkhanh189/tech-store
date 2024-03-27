import AutoCompleteField from '@components/common/form/AutoCompleteField';
import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import NumericField from '@components/common/form/NumericField';
import SelectField from '@components/common/form/SelectField';
import TextField from '@components/common/form/TextField';
import apiConfig from '@constants/apiConfig';
import { statusOptions } from '@constants/masterData';
import useAuth from '@hooks/useAuth';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import { showErrorMessage } from '@services/notifyService';
import { IconPlus } from '@tabler/icons-react';
import { IconMinus } from '@tabler/icons-react';
import { formatMoney } from '@utils';
import { Button, Card, Col, Form, InputNumber, Modal, Row, Table } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, defineMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';

const message = defineMessage({
    copyRight: '{brandName} - © Copyright {year}. All Rights Reserved',
    loginFail: 'Chưa điền đủ các trường thông tin!!!',
    login: 'Đăng nhập',
});

const ListDetailsForm = ({ open, onCancel, data, form, itemCart, saleOff, nameProduct }) => {
    const { profile } = useAuth();
    const [cartItem, setCartItem] = useState([]);
    const [checkList, setCheckArray] = useState(false);
    const [skipFirstSubmit, setSkipFirstSubmit] = useState(true);
    const translate = useTranslate();
    const statusValues = translate.formatKeys(statusOptions, ['label']);
    const navigate = useNavigate();
    const [imageUrl, setImageUrl] = useState(null);
    const { execute: executeUpFile } = useFetch(apiConfig.file.upload);
    const { execute, loading } = useFetch({
        ...apiConfig.cart.add,
    });
    const [tableData, setTableData] = useState([]);

    // Kiểm tra xem itemCart có tồn tại không trước khi sử dụng map
    const [newArray, setnewArray] = useState([]);
    const [newArray1, setnewArray1] = useState([]);

    const [cart, setCart] = useState([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        // Lấy giỏ hàng từ localStorage khi component được render
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        console.log(storedCart);
        setCart(storedCart);
        calculateTotal(storedCart);
    }, []);

    useEffect(() => {
        // Lưu giỏ hàng vào localStorage khi giỏ hàng thay đổi
        localStorage.setItem('cart', JSON.stringify(cart));
        calculateTotal(cart);
    }, [cart]);

    const calculateTotal = (cartItems) => {
        const newTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        setTotal(newTotal);
    };

    const addToCart = (product) => {
        const existingItem = cart.find((item) => item.id === product.id);

        if (existingItem) {
            // Nếu sản phẩm đã tồn tại trong giỏ hàng, tăng số lượng lên
            const updatedCart = cart.map((item) =>
                item.id === product.id
                    ? { ...item, quantity: item?.quantity + product.quantity, total: item?.total + product.total }
                    : item,
            );
            setCart(updatedCart);
        } else {
            // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
            setCart([...cart, { ...product }]);
        }
    };

    const removeFromCart = (productId) => {
        const updatedCart = cart.filter((item) => item.id !== productId);
        setCart(updatedCart);
    };

    const updateArray = () => {
        setnewArray(itemCart ? itemCart.map((item) => ({ ...item, quantity: 0, name: nameProduct })) : []);
    };

    // Gọi hàm updateArray khi cần thiết, chẳng hạn trong useEffect hoặc một sự kiện nào đó.
    useEffect(() => {
        // const quantity = form.getFieldValue('quantity');
        // const price = form.getFieldValue('price');
        updateArray();
    }, [itemCart]);
    useEffect(() => {
        if (skipFirstSubmit) {
            setSkipFirstSubmit(false);
            return;
        }
        setnewArray((prevArray) => prevArray.filter((item) => item.quantity !== 0));
        setCheckArray(false);
    }, [checkList]);
    useEffect(() => {
        // console.log(newArray);
    }, [newArray]);

    const handleFinish = () => {
        // checkArray();
        console.log(newArray);
        if (profile) {
            console.log('profie');
            let data;
            data = { variantId: newArray[0].id, quantity: newArray[0].quantity };
            execute({
                data: { ...data },
                onCompleted: (res) => {
                    // setCacheAccessToken(res.access_token);
                    // executeGetProfile();
                    window.location.reload();
                    onCancel();
                    message.success('Thêm vào giỏ hàng thành công');
                },
                onError: () => {
                    showErrorMessage(translate.formatMessage(message.loginFail));
                    form.resetFields();
                },
            });
        } else {
            newArray.forEach((product) => {
                addToCart(product);
            });
            message.success('Đặt hàng thành công');
        }
        onCancel();
        // removeFromCart(7000194750545920);
    };

    const onChange = (id, item) => {
        form.setFieldValue('projectRoleId', item);
    };
    const uploadFile = (file, onSuccess, onError) => {
        executeUpFile({
            data: {
                type: 'AVATAR',
                file: file,
            },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    setImageUrl(response.data.filePath);
                    // setIsChangedFormValues(true);
                }
            },
            onError: (error) => {
                onError();
            },
        });
    };
    const handleParser = (value) => {
        // Xử lý giá trị trước khi hiển thị
        const parsedValue = value.toString().replace(/[^0-9]/g, ''); // Chỉ giữ lại số
        return parsedValue;
    };

    return (
        <Modal
            title={<FormattedMessage defaultMessage="Vui lòng chọn sản phẩm" />}
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            width={800}
        >
            <Form form={form} onFinish={handleFinish}>
                <Table
                    pagination={false}
                    onChange={(extra) => {
                        // Dữ liệu mới của Table có thể được lấy từ extra.currentDataSource
                        setTableData(extra.currentDataSource);
                    }}
                    columns={[
                        {
                            title: 'Tên sản phẩm',
                            dataIndex: 'name',
                            align: 'center',
                        },
                        {
                            title: 'Màu sắc',
                            dataIndex: 'color',
                            align: 'center',
                        },
                        {
                            title: 'Giá',
                            dataIndex: 'price',
                            name: 'price',
                            render: (value) => {
                                return (
                                    <span>
                                        {formatMoney(value - (value * saleOff) / 100, {
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
                            title: 'Số lượng trong kho',
                            dataIndex: 'totalStock',
                            align: 'center',
                        },
                        {
                            title: 'Quantity',
                            dataIndex: 'quantity',
                            align: 'center',
                            render: (value, record) => {
                                return (
                                    <InputNumber
                                        min={0}
                                        max={record.totalStock}
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        // parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                        parser={handleParser}
                                        defaultValue={0}
                                        onChange={(value) => {
                                            setnewArray((pre) =>
                                                pre.map((cart) => {
                                                    if (record.id === cart.id) {
                                                        cart.total =
                                                            (cart.price - (cart.price * saleOff) / 100) * value;
                                                        cart.quantity = value;
                                                    }
                                                    return cart;
                                                }),
                                            );
                                            setCheckArray(true);
                                            console.log(record.totalStock);
                                        }}
                                    ></InputNumber>
                                );
                            },
                        },
                        {
                            title: 'Total',
                            dataIndex: 'total',
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
                    dataSource={newArray}
                    summary={(data) => {
                        const total = data.reduce((pre, current) => {
                            return pre + current.total;
                        }, 0);
                        return (
                            <span>
                                Total:{' '}
                                {formatMoney(total, {
                                    groupSeparator: ',',
                                    decimalSeparator: '.',
                                    currentcy: 'đ',
                                    currentcyPosition: 'BACK',
                                    currentDecimal: '0',
                                })}
                            </span>
                        );
                    }}
                ></Table>
            </Form>
        </Modal>
    );
};

function AddToCardButton(itemCart) {
    const [cart, setCart] = useState([]);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        // Lấy giỏ hàng từ localStorage khi component được render
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        console.log(storedCart);
        setCart(storedCart);
        calculateTotal(storedCart);
    }, []);

    useEffect(() => {
        // Lưu giỏ hàng vào localStorage khi giỏ hàng thay đổi
        localStorage.setItem('cart', JSON.stringify(cart));
        calculateTotal(cart);
    }, [cart]);

    const calculateTotal = (cartItems) => {
        const newTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        setTotal(newTotal);
    };

    const addToCart = () => {
        // const existingItem = cart.find((item) => item.id === product.id);
        // if (existingItem) {
        //     // Nếu sản phẩm đã tồn tại trong giỏ hàng, tăng số lượng lên
        //     const updatedCart = cart.map((item) =>
        //         item.id === product.id ? { ...item, quantity: item?.quantity + product.quantity } : item,
        //     );
        //     setCart(updatedCart);
        // } else {
        //     // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
        //     setCart([...cart, { ...product }]);
        // }
    };

    const removeFromCart = (productId) => {
        const updatedCart = cart.filter((item) => item.id !== productId);
        setCart(updatedCart);
    };
    useEffect(() => {
        addToCart();
    }, [itemCart]);
    // return <>{addToCart(itemCart)}</>;
}

export default ListDetailsForm;
