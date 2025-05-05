import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './MainLayout.scss';

// Компонент макета приймає дочірні елементи (children) для відображення основного контенту
const MainLayout = ({ children }) => {
    return (
        <div className="main-layout">
            <Header />
            <main className="main-content">
                {children} {/* Тут буде рендеритись основний контент сторінки (напр., MapPage) */}
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;