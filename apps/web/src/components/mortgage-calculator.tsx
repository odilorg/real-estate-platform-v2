'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@repo/ui';

interface MortgageCalculatorProps {
  propertyPrice: number;
}

type ProgramType = 'Базовая' | 'Семейная' | 'IT-ипотека';

export function MortgageCalculator({ propertyPrice }: MortgageCalculatorProps) {
  const [price, setPrice] = useState(propertyPrice);
  const [downPayment, setDownPayment] = useState(Math.round(propertyPrice * 0.5));
  const [downPaymentPercent, setDownPaymentPercent] = useState(50);
  const [loanTerm, setLoanTerm] = useState(30);
  const [program, setProgram] = useState<ProgramType>('Базовая');

  // Interest rates by program
  const interestRates = {
    'Базовая': 14.0,
    'Семейная': 6.0,
    'IT-ипотека': 5.0,
  };

  // Calculate mortgage payment
  const calculateMonthlyPayment = () => {
    const loanAmount = price - downPayment;
    const monthlyRate = interestRates[program] / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    if (monthlyRate === 0) {
      return loanAmount / numberOfPayments;
    }

    const monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    return monthlyPayment;
  };

  const monthlyPayment = calculateMonthlyPayment();
  const loanAmount = price - downPayment;
  const totalPayment = monthlyPayment * loanTerm * 12;
  const totalInterest = totalPayment - loanAmount;

  // Update down payment when percentage changes
  const handleDownPaymentPercentChange = (percent: number) => {
    setDownPaymentPercent(percent);
    setDownPayment(Math.round((price * percent) / 100));
  };

  // Update percentage when down payment changes
  const handleDownPaymentChange = (value: number) => {
    setDownPayment(value);
    setDownPaymentPercent(Math.round((value / price) * 100));
  };

  // Update price
  const handlePriceChange = (value: number) => {
    setPrice(value);
    setDownPayment(Math.round((value * downPaymentPercent) / 100));
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Ипотечный калькулятор
        </h2>

        <div className="space-y-6">
          {/* Property Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Стоимость недвижимости
            </label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                у.е.
              </span>
            </div>
          </div>

          {/* Programs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Программы
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setProgram('Базовая')}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  program === 'Базовая'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Базовая
              </button>
              <button
                onClick={() => setProgram('Семейная')}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  program === 'Семейная'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Семейная
              </button>
              <button
                onClick={() => setProgram('IT-ипотека')}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  program === 'IT-ипотека'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                IT-ипотека
              </button>
            </div>
          </div>

          {/* Down Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Первый взнос
            </label>
            <div className="relative mb-3">
              <input
                type="number"
                value={downPayment}
                onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                у.е.
              </span>
            </div>
            <div className="flex gap-2">
              {[20.1, 30, 40, 50].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleDownPaymentPercentChange(percent)}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                    Math.abs(downPaymentPercent - percent) < 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Loan Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Срок кредита
            </label>
            <div className="relative mb-3">
              <input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                min="1"
                max="30"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                лет
              </span>
            </div>
            <div className="flex gap-2">
              {[10, 20, 30].map((years) => (
                <button
                  key={years}
                  onClick={() => setLoanTerm(years)}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                    loanTerm === years
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {years} лет
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Ежемесячный платеж</div>
                <div className="text-2xl md:text-3xl font-bold text-blue-600">
                  {Math.round(monthlyPayment).toLocaleString('ru-RU')} у.е.
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Сумма кредита</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                  {Math.round(loanAmount).toLocaleString('ru-RU')} у.е.
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Процентная ставка</span>
                <span className="font-semibold text-gray-900">{interestRates[program]}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Переплата по кредиту</span>
                <span className="font-semibold text-gray-900">
                  {Math.round(totalInterest).toLocaleString('ru-RU')} у.е.
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Общая сумма выплат</span>
                <span className="font-semibold text-gray-900">
                  {Math.round(totalPayment).toLocaleString('ru-RU')} у.е.
                </span>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="flex justify-center pt-4">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-60"
            >
              <circle cx="60" cy="45" r="20" fill="#E5E7EB" />
              <circle cx="60" cy="45" r="18" fill="#1E3A8A" />
              <circle cx="55" cy="42" r="3" fill="white" />
              <circle cx="65" cy="42" r="3" fill="white" />
              <path
                d="M 50 50 Q 60 55 70 50"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
              <rect x="35" y="65" width="50" height="35" rx="5" fill="#E5E7EB" />
              <rect x="45" y="75" width="10" height="15" fill="#1E3A8A" />
              <rect x="65" y="75" width="10" height="15" fill="#1E3A8A" />
              <path d="M 30 65 L 60 45 L 90 65" fill="#1E3A8A" />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
