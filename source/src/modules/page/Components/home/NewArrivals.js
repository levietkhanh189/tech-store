import React, { useEffect, useState } from 'react';
import { getProducts, getProductsCount } from '../../functions/product';
import ProductCard from '../cards/ProductCard';
// import {LoadingOutlined} from "@ant-design/icons";
import Border from '../cards/Border';
import LoadingCard from '../cards/LoadingCard';
// import { Pagination } from "antd";
import { Pagination } from '@mui/material';

const NewArrivals = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [productsCount, setProductsCount] = useState(0);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadAllProducts();
    }, [page]);

    useEffect(() => {
        getProductsCount().then((res) => setProductsCount(res.data));
    }, []);

    const handleChange = (e, p) => {
        setPage(p);
    };

    const loadAllProducts = () => {
        setLoading(true);
        getProducts('createdAt', 'desc', page)
            .then((res) => {
                setProducts(res.data);
                setLoading(false);
            })
            .catch((err) => {
                setLoading(false);
                console.log(err);
            });
    };

    return (
        <>
            <div className="col">
                {loading ? (
                    <LoadingCard count={3} />
                ) : (
                    <div className="row">
                        {products.map((product) => (
                            <div key={product._id} className="col-md-4">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Pagination
                className="col-md-4 offset-md-4 text-center pt-5 p-3"
                count={Math.ceil(productsCount / 3)}
                color="primary"
                variant="outlined"
                shape="rounded"
                page={page}
                onChange={handleChange}
            />
        </>
    );
};
export default NewArrivals;
