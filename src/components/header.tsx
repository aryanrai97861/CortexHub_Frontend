import React from 'react'

const Header = () => {
  return (
    <div className='bg-gray-900 text-white p-4 justify-between flex items-center'>
      <h1 className='text-2xl font-bold'>CortexHub</h1>
      <nav>
        <ul className='flex space-x-6'>
          <li>
            <button className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>Feature</button>
          </li>
          <li>
            <button className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>Docs</button>
          </li>
          <li>
            <button className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>Pricing</button>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Header
