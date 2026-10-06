import { useEffect, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import './App.jsx.scss';
import xmartonTemplate from './assets/xmarton.html?raw';

const templates = [
    { label: 'Xmarton', value: 'xmarton' },
]

const HOURLY_RATE = 750; // Kč za hodinu
const BONUS_RATE = 25.3; // % z ceny
const VAT_RATE = 0.21; // 21% DPH
const DUE_INTERVAL = 20;

function formatCzechCurrency(value) {
    const num = parseFloat(value);
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return integerPart + ',' + parts[1];
}

function initNumber(template) {
    switch (template) {
        case 'xmarton': {
            var date = new Date();
            var prevMonthIdx = date.getMonth() - 1;
            var year = date.getFullYear();
            if (prevMonthIdx === -1) {
                prevMonthIdx = 11;
                year -= 1;
            }
            var prevMonth = String(prevMonthIdx + 1).padStart(2, '0');
            return `${year}01${prevMonth}`;
        }
        default: return '';
    }
}

function App() {

    const [template, setTemplate] = useState('xmarton');
    const [number, setNumber] = useState(initNumber('xmarton'));
    const [hours, setHours] = useState('');
    const invoiceFrameRef = useRef(null);
    const [generatedHtml, setGeneratedHtml] = useState(null);

    function adjustIframeHeight() {
        if (invoiceFrameRef.current) {
            try {
                const iframeDoc = invoiceFrameRef.current.contentDocument || invoiceFrameRef.current.contentWindow.document;
                if (iframeDoc) {
                    const height = iframeDoc.documentElement.scrollHeight;
                    invoiceFrameRef.current.style.height = (height + 20) + 'px';
                }
            } catch (e) {
                console.error('Chyba při nastavení výšky iframu:', e);
            }
        }
    }

    async function run(e) {
        e.preventDefault();

        try {
            const formData = Object.fromEntries(new FormData(e.currentTarget));
            const { number, hours } = formData;

            if (!number || !hours) {
                toast.error('Vyplňte všechna povinná pole');
                return;
            }

            const hoursNum = parseFloat(hours);
            if (isNaN(hoursNum) || hoursNum <= 0) {
                toast.error('Počet hodin musí být kladné číslo');
                return;
            }

            // Výpočet cen
            const price = hoursNum * HOURLY_RATE;
            const priceWithVat = price * (1 + VAT_RATE);
            const bonus = price * (BONUS_RATE / 100);
            const bonusWithVat = bonus * (1 + VAT_RATE);
            const taxableBase = price + bonus;
            const vatAmount = taxableBase * VAT_RATE;
            const totalAmount = taxableBase + vatAmount;

            // Extrahování roku a měsíce z čísla faktury (format: YYYYMM)
            const period = number.substring(4); // poslední 2 znaky jsou měsíc
            const monthNames = ['', 'ledna', 'února', 'března', 'dubna', 'května', 'června', 
                                'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
            const monthName = monthNames[parseInt(period)] || period;

            // Vytvoření datumů
            const today = new Date();
            const issueDate = today.toLocaleDateString('cs-CZ');
            const dueDateObj = new Date(today.getTime() + DUE_INTERVAL * 24 * 60 * 60 * 1000);
            const dueDate = dueDateObj.toLocaleDateString('cs-CZ');
            const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            const taxableSupplyDate = lastDayOfPrevMonth.toLocaleDateString('cs-CZ');

            // Tvorba periodText z dueDate (vycházíme z datumu splatnosti)
            const dueDateMonth = dueDateObj.getMonth(); // 0-11
            const dueDateYear = dueDateObj.getFullYear();
            const monthNamesNominative = ['', 'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
                                  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
            const dueDateMonthName = monthNamesNominative[dueDateMonth];
            const periodText = `${dueDateMonthName} ${dueDateYear}`;

            // Nahrazení proměnných v šabloně
            let html = xmartonTemplate
                .replace(/%number%/g, number)
                .replace(/%hours%/g, hoursNum.toFixed(2))
                .replace(/%price%/g, formatCzechCurrency(price))
                .replace(/%price_with_vat%/g, formatCzechCurrency(priceWithVat))
                .replace(/%bonus%/g, formatCzechCurrency(bonus))
                .replace(/%bonus_with_vat%/g, formatCzechCurrency(bonusWithVat))
                .replace(/%taxable_base%/g, formatCzechCurrency(taxableBase))
                .replace(/%vat_amount%/g, formatCzechCurrency(vatAmount))
                .replace(/%total_amount%/g, formatCzechCurrency(totalAmount))
                .replace(/%issue_date%/g, issueDate)
                .replace(/%due_date%/g, dueDate)
                .replace(/%taxable_supply_date%/g, taxableSupplyDate)
                .replace(/%period%/g, periodText);

            console.log('Template loaded:', xmartonTemplate ? 'yes' : 'no');
            console.log('Generated HTML length:', html.length);
            console.log('First 200 chars:', html.substring(0, 200));

            // Zobrazení faktury v iframe
            if (invoiceFrameRef.current) {
                try {
                    // Vytvoříme blob z HTML
                    const blob = new Blob([html], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);

                    // Uložíme HTML pro pozdější použití
                    setGeneratedHtml(html);

                    // Nastavíme onload handler pro přizpůsobení výšky
                    invoiceFrameRef.current.onload = adjustIframeHeight;

                    // Nastavíme URL do iframe
                    invoiceFrameRef.current.src = blobUrl;

                    console.log('Blob URL nastavena:', blobUrl);
                } catch (err) {
                    console.error('Chyba při vytváření blob URL:', err);
                }
            }
            console.log('dev', 'html', html);

            toast.success('Faktura byla vygenerována');
        } catch (error) {
            console.error('Chyba při generování faktury:', error);
            toast.error('Chyba při generování faktury');
        }
    }

    function onChangeTemplate(e) {
        setTemplate(e.target.value);
        setNumber(initNumber(e.target.value));
    }

    function handlePrint() {
        if (invoiceFrameRef.current) {
            try {
                invoiceFrameRef.current.contentWindow.print();
            } catch (error) {
                console.error('Chyba při tisku:', error);
                toast.error('Chyba při tisku faktury');
            }
        }
    }

    function handleDownload() {
        if (!generatedHtml) {
            toast.error('Nejdříve generuj fakturu');
            return;
        }

        try {
            const element = document.createElement('a');
            const file = new Blob([generatedHtml], { type: 'text/html' });
            element.href = URL.createObjectURL(file);
            element.download = `FA${number}.html`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            toast.success('Faktura byla uložena');
        } catch (error) {
            console.error('Chyba při ukládání:', error);
            toast.error('Chyba při ukládání faktury');
        }
    }

    return (
        <div>
            <h1>Faktury</h1>
            <form onSubmit={run}>
                <label>Šablona</label>
                <select
                    name='template'
                    value={template}
                    onChange={onChangeTemplate}
                    autoFocus
                >
                    {templates.map(o => {
                        return (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        );
                    })}
                </select>

                <label>Číslo</label>
                <input
                    name='number'
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                />

                <label>Počet hodin</label>
                <input
                    name='hours'
                    type='number'
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                />
                <button type='submit'>Generuj</button>
            </form>
            {generatedHtml && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button onClick={handleDownload} style={{ padding: '8px 16px' }}>Uložit</button>
                    <button onClick={handlePrint} style={{ padding: '8px 16px' }}>Tisknout</button>
                </div>
            )}
            <iframe 
                ref={invoiceFrameRef}
                style={{ width: '100%', border: '1px solid #ccc', marginTop: '20px', display: generatedHtml ? 'block' : 'none' }}
            ></iframe>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
    
    // async function populateWeatherData() {
    //     const response = await fetch('weatherforecast');
    //     if (response.ok) {
    //         const data = await response.json();
    //     }
    // }
}

export default App;