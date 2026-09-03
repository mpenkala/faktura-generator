import { useEffect, useState } from 'react';
import './App.jsx.scss';

const templates = [
    { label: 'Xmarton', value: 'xmarton' },
]

function App() {

    const [template, setTemplate] = useState('xmarton');
    const [number, setNumber] = useState('');
    const [hours, setHours] = useState('');

    useEffect(() => {
        populateWeatherData();
    }, []);

    return (
        <div>
            <h1>Faktury</h1>
            <form>
                <label>Šablona</label>
                <select
                    value={template}
                    onChange={e => setTemplate(e.target.value)}
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
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                />

                <label>Počet hodin</label>
                <input
                    type='number'
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                />
                <button type='submit'>Generuj</button>
            </form>
        </div>
    );
    
    async function populateWeatherData() {
        const response = await fetch('weatherforecast');
        if (response.ok) {
            const data = await response.json();
        }
    }
}

export default App;