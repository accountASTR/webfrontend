import React, { useEffect, useState } from 'react';
import { Button, Form, Space } from 'antd';
import ShopAddData from './shop-add-data';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { setMenuData } from 'redux/slices/menu';
import shopService from 'services/seller/shop';
import { useTranslation } from 'react-i18next';
import getDefaultLocation from 'helpers/getDefaultLocation';
import { fetchMyShop } from 'redux/slices/myShop';
import { ShopTypes } from 'constants/shop-types';

const ShopMain = ({ next }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { settings } = useSelector(
    (state) => state.globalSettings,
    shallowEqual,
  );

  const [location, setLocation] = useState(
    activeMenu?.data?.location
      ? {
          lat: parseFloat(activeMenu?.data?.location?.latitude),
          lng: parseFloat(activeMenu?.data?.location?.longitude),
        }
      : getDefaultLocation(settings),
  );
  const [loadingBtn, setLoadingBtn] = useState(false);
  const { myShop } = useSelector((state) => state.myShop, shallowEqual);
  const [logoImage, setLogoImage] = useState(
    activeMenu.data?.logo_img ? [activeMenu.data?.logo_img] : [],
  );
  const [backImage, setBackImage] = useState(
    activeMenu.data?.background_img ? [activeMenu.data?.background_img] : [],
  );

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      data.open_time = JSON.stringify(data?.open_time);
      data.close_time = JSON.stringify(data?.close_time);
      dispatch(
        setMenuData({ activeMenu, data: { ...activeMenu.data, ...data } }),
      );
    };
  }, []);

  const onFinish = (values) => {
    setLoadingBtn(true);
    const body = {
      ...values,
      delivery_type: values?.delivery_type?.value || values?.delivery_type,
      'images[0]': logoImage[0]?.name,
      'images[1]': backImage[0]?.name,
      delivery_time_type: values.delivery_time_type,
      delivery_time_to: values.delivery_time_to || 0,
      delivery_time_from: values.delivery_time_from || 0,
      user_id: values.user.value,
      visibility: undefined,
      'location[latitude]': location.lat,
      'location[longitude]': location.lng,
      user: undefined,
      delivery_time: 0,
      type: myShop.type === 'shop' ? 'shop' : 'restaurant',
      tags: values.tags.map((e) => e.value),
      ...Object.assign(
        {},
        ...(values?.emailStatuses?.map((item, index) => ({
          [`email_statuses[${index}]`]: item?.value || item,
        })) ?? []),
      ),
    };
    delete body?.background_img;
    delete body?.logo_img;
    shopUpdate(values, body);
  };

  function shopUpdate(values, params) {
    shopService
      .update(params)
      .then(() => {
        batch(() => {
          dispatch(
            setMenuData({
              activeMenu,
              data: values,
            }),
          );
          dispatch(fetchMyShop({}));
        });
        next();
      })
      .finally(() => setLoadingBtn(false));
  }

  return (
    <>
      <Form
        form={form}
        name='basic'
        layout='vertical'
        onFinish={onFinish}
        initialValues={{
          visibility: true,
          status: 'new',
          ...activeMenu.data,
          delivery_type: activeMenu.data?.delivery_type ?? ShopTypes[0],
        }}
      >
        <ShopAddData
          logoImage={logoImage}
          setLogoImage={setLogoImage}
          backImage={backImage}
          setBackImage={setBackImage}
          form={form}
          location={location}
          setLocation={setLocation}
        />
        <Space>
          <Button type='primary' htmlType='submit' loading={loadingBtn}>
            {t('next')}
          </Button>
        </Space>
      </Form>
    </>
  );
};
export default ShopMain;
