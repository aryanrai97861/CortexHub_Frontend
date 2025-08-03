import React from 'react'

const Header = () => {
  return (
    <header className='bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white shadow-2xl border-b border-blue-800/30'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center'>
              <div className='w-4 h-4 bg-white rounded-sm transform rotate-45'></div>
            </div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent'>
              CortexHub
            </h1>
          </div>
          <nav className='hidden md:block'>
            <ul className='flex space-x-8'>
              <li>
                <button className='relative px-4 py-2 text-sm font-medium text-blue-100 hover:text-white transition-all duration-300 group'>
                  Features
                  <span className='absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300'></span>
                </button>
              </li>
              <li>
                <button className='relative px-4 py-2 text-sm font-medium text-blue-100 hover:text-white transition-all duration-300 group'>
                  Docs
                  <span className='absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300'></span>
                </button>
              </li>
              <li>
                <button className='relative px-4 py-2 text-sm font-medium text-blue-100 hover:text-white transition-all duration-300 group'>
                  Pricing
                  <span className='absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300'></span>
                </button>
              </li>
            </ul>
          </nav>
          <div className='md:hidden'>
            <button className='p-2 rounded-lg hover:bg-blue-800/50 transition-colors duration-200'>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className='md:hidden border-t border-blue-800/30'>
        <div className='px-4 py-3 space-y-1'>
          <li>
            <button className='block w-full text-left px-3 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-800/50 rounded-lg transition-all duration-200'>
              Features
            </button>
          </li>
          <li>
            <button className='block w-full text-left px-3 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-800/50 rounded-lg transition-all duration-200'>
              Docs
            </button>
          </li>
          <li>
            <button className='block w-full text-left px-3 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-800/50 rounded-lg transition-all duration-200'>
              Pricing
            </button>
          </li>
        </div>
      </div>
    </header>
  )
}

export default Header
