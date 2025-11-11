import {useState} from "react";
import {
    format,
    isAfter,
    differenceInYears,
    differenceInMonths,
    differenceInDays,
    subYears,
    subMonths,
    subDays
} from 'date-fns';

export type InputMode = 'DOB' | 'AGE';

interface DOBModeInput {
    mode: 'DOB';
    year?: number;
    month?: number;
    day?: number;
}

interface AgeModeInput {
    mode: 'AGE';
    years?: number;
    months?: number;
    days?: number;
}

export function getDOBAndAge(
    input: DOBModeInput | AgeModeInput
): { dob: string; age: string; isFuture: boolean } {
    const now = new Date();

    if (input.mode === 'DOB') {
        const {year, month, day} = input;

        const finalYear = year ?? now.getFullYear();
        const finalMonth = month ?? now.getMonth() + 1;
        const finalDay = day ?? now.getDate();

        const dobDate = new Date(finalYear, finalMonth - 1, finalDay);
        const isFuture = isAfter(dobDate, now);

        const dob = format(dobDate, 'yyyy-MM-dd');

        if (isFuture) return {dob, isFuture, age: 'Invalid (future date)'};

        // Calculate exact difference
        const years = differenceInYears(now, dobDate);
        const months = differenceInMonths(now, dobDate) - years * 12;
        const days = differenceInDays(
            now,
            new Date(now.getFullYear(), now.getMonth() - months, now.getDate())
        );

        let ageText = '';
        if (years > 0) ageText += `${years} year${years > 1 ? 's' : ''} `;
        if (months > 0) ageText += `${months} month${months > 1 ? 's' : ''} `;
        if (years === 0 && days > 0) ageText += `${days} day${days > 1 ? 's' : ''}`;
        if (!ageText.trim()) ageText = '0 days';

        return {dob, isFuture, age: ageText.trim()};
    }

    // Mode 2 — Input is AGE
    const {years = 0, months = 0, days = 0} = input;
    let dobDate = subYears(now, years);
    dobDate = subMonths(dobDate, months);
    dobDate = subDays(dobDate, days);

    const dob = format(dobDate, 'yyyy-MM-dd');

    const ageText = `${years ? years + 'y ' : ''}${months ? months + 'm ' : ''}${days ? days + 'd' : ''}`.trim() || '0 days';

    return {dob, isFuture: false, age: ageText};
}

const Test = () => {

    // Age inputs
    const [years, setYears] = useState<number | undefined>();
    const [months, setMonths] = useState<number | undefined>();
    const [days, setDays] = useState<number | undefined>();

    const {dob, age, isFuture} = getDOBAndAge({mode: 'AGE', years, months, days});
    return <div style={{
        padding: '40px',
    }}>
        <div style={{display: 'flex', gap: '10px', marginTop: 10}}>
            <input
                type="number"
                placeholder="Years"
                value={years ?? ''}
                onChange={(e) => setYears(e.target.value ? Number(e.target.value) : undefined)}
            />
            <input
                type="number"
                placeholder="Months"
                value={months ?? ''}
                onChange={(e) => setMonths(e.target.value ? Number(e.target.value) : undefined)}
            />
            <input
                type="number"
                placeholder="Days"
                value={days ?? ''}
                onChange={(e) => setDays(e.target.value ? Number(e.target.value) : undefined)}
            />
        </div>
        <div style={{marginTop: 15}}>
            <strong>DOB:</strong> {dob}
        </div>
        {isFuture && <p style={{color: 'red'}}>⚠️ DOB cannot be in the future</p>}
        <div>
            <strong>Age:</strong> {age}
        </div>
    </div>
}

export default Test;