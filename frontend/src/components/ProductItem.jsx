import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'

const ProductItem = ({id, image, name, price}) => {
  const { currency } = useContext(ShopContext);

  return (
    <Link className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
      {/* Thêm tỷ lệ khung hình cố định (aspect-square) cho div bọc ngoài */}
      <div className='overflow-hidden aspect-square bg-gray-50 flex items-center justify-center'>
        {/* Thêm w-full h-full object-cover để ảnh lấp đầy khung mà không bị méo */}
        <img className='hover:scale-110 transition ease-in-out w-full h-full object-cover' src={image[0]} alt="" />
      </div>
      <p className='pt-3 pb-1 text-sm'>{name}</p>
      <p className='text-sm font-medium'>{currency}{price}</p>
    </Link>
  )
}

export default ProductItem