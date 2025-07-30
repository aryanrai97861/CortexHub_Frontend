import React from 'react'

const Footer = () => {
  return (
    <div className='bg-gray-900 text-white p-4'>
      <div className='max-w-7xl mx-auto text-center'>
        <p className='text-sm'>
          &copy; {new Date().getFullYear()} CortexHub. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default Footer
