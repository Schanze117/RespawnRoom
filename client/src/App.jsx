import { Outlet } from 'react-router-dom';
import Header from './components/header';
import Aside from './components/Aside';
import Footer from './components/Footer';
import './App.css'

function App() {

  return (
    <>
      <Header />
      <Aside />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default App
