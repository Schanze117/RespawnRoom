import { Outlet } from 'react-router-dom';
import Header from './components/header';
import './App.css'

function App() {

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default App
