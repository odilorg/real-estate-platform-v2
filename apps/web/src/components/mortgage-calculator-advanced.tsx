'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@repo/ui';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';

interface MortgageCalculatorAdvancedProps {
  propertyPrice: number;
}

type ProgramType = 'Базовая' | 'Семейная' | 'IT-ипотека';

interface PaymentScheduleItem {
  month: number;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
}

export function MortgageCalculatorAdvanced({ propertyPrice }: MortgageCalculatorAdvancedProps) {
  const [price, setPrice] = useState(propertyPrice);
  const [downPayment, setDownPayment] = useState(Math.round(propertyPrice * 0.5));
  const [downPaymentPercent, setDownPaymentPercent] = useState(50);
  const [loanTerm, setLoanTerm] = useState(30);
  const [program, setProgram] = useState<ProgramType>('Базовая');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleView, setScheduleView] = useState<'monthly' | 'yearly'>('yearly');

  // Interest rates by program
  const interestRates = {
    'Базовая': 14.0,
    'Семейная': 6.0,
    'IT-ипотека': 5.0,
  };

  // Calculate amortization schedule
  const paymentSchedule = useMemo((): PaymentScheduleItem[] => {
    const loanAmount = price - downPayment;
    const monthlyRate = interestRates[program] / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    if (monthlyRate === 0) {
      const monthlyPrincipal = loanAmount / numberOfPayments;
      return Array.from({ length: numberOfPayments }, (_, i) => ({
        month: i + 1,
        monthlyPayment: monthlyPrincipal,
        principalPayment: monthlyPrincipal,
        interestPayment: 0,
        remainingBalance: loanAmount - monthlyPrincipal * (i + 1),
      }));
    }

    const monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    let remainingBalance = loanAmount;
    const schedule: PaymentScheduleItem[] = [];

    for (let i = 0; i < numberOfPayments; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      schedule.push({
        month: i + 1,
        monthlyPayment,
        principalPayment,
        interestPayment,
        remainingBalance: Math.max(0, remainingBalance),
      });
    }

    return schedule;
  }, [price, downPayment, loanTerm, program]);

  // Calculate yearly summary
  const yearlySummary = useMemo(() => {
    const years: {
      year: number;
      totalPayment: number;
      totalPrincipal: number;
      totalInterest: number;
      endingBalance: number;
    }[] = [];

    for (let year = 0; year < loanTerm; year++) {
      const startMonth = year * 12;
      const endMonth = Math.min((year + 1) * 12, paymentSchedule.length);
      const yearPayments = paymentSchedule.slice(startMonth, endMonth);

      years.push({
        year: year + 1,
        totalPayment: yearPayments.reduce((sum, p) => sum + p.monthlyPayment, 0),
        totalPrincipal: yearPayments.reduce((sum, p) => sum + p.principalPayment, 0),
        totalInterest: yearPayments.reduce((sum, p) => sum + p.interestPayment, 0),
        endingBalance: yearPayments[yearPayments.length - 1]?.remainingBalance || 0,
      });
    }

    return years;
  }, [paymentSchedule, loanTerm]);

  const monthlyPayment = paymentSchedule[0]?.monthlyPayment || 0;
  const loanAmount = price - downPayment;
  const totalPayment = paymentSchedule.reduce((sum, p) => sum + p.monthlyPayment, 0);
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

  // Download schedule as CSV
  const downloadSchedule = () => {
    const headers = ['Месяц', 'Платеж', 'Основной долг', 'Проценты', 'Остаток'];
    const rows = paymentSchedule.map(p => [
      p.month,
      Math.round(p.monthlyPayment),
      Math.round(p.principalPayment),
      Math.round(p.interestPayment),
      Math.round(p.remainingBalance),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'график-платежей.csv';
    link.click();
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
              {(['Базовая', 'Семейная', 'IT-ипотека'] as ProgramType[]).map((prog) => (
                <button
                  key={prog}
                  onClick={() => setProgram(prog)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                    program === prog
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {prog}
                </button>
              ))}
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
              {[20, 30, 40, 50].map((percent) => (
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

            {/* Payment Breakdown Visualization */}
            <div className="mt-6">
              <div className="text-sm font-medium text-gray-700 mb-3">Структура платежа (1-й месяц)</div>
              <div className="h-8 flex rounded-lg overflow-hidden">
                <div
                  className="bg-blue-600 flex items-center justify-center text-white text-xs font-medium"
                  style={{
                    width: `${(paymentSchedule[0]?.principalPayment / monthlyPayment) * 100}%`,
                  }}
                  title="Основной долг"
                >
                  {Math.round((paymentSchedule[0]?.principalPayment / monthlyPayment) * 100)}%
                </div>
                <div
                  className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{
                    width: `${(paymentSchedule[0]?.interestPayment / monthlyPayment) * 100}%`,
                  }}
                  title="Проценты"
                >
                  {Math.round((paymentSchedule[0]?.interestPayment / monthlyPayment) * 100)}%
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Основной долг: {Math.round(paymentSchedule[0]?.principalPayment || 0).toLocaleString('ru-RU')} у.е.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>Проценты: {Math.round(paymentSchedule[0]?.interestPayment || 0).toLocaleString('ru-RU')} у.е.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Schedule Toggle */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center justify-between w-full text-left font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              <span className="text-lg">График платежей</span>
              {showSchedule ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {showSchedule && (
              <div className="mt-6 space-y-4">
                {/* View Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setScheduleView('yearly')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                        scheduleView === 'yearly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      По годам
                    </button>
                    <button
                      onClick={() => setScheduleView('monthly')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                        scheduleView === 'monthly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      По месяцам
                    </button>
                  </div>

                  <button
                    onClick={downloadSchedule}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Скачать CSV
                  </button>
                </div>

                {/* Yearly View */}
                {scheduleView === 'yearly' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">Год</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Платеж</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Основной долг</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Проценты</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Остаток</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {yearlySummary.map((year) => (
                          <tr key={year.year} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{year.year}</td>
                            <td className="px-4 py-3 text-right text-gray-900">
                              {Math.round(year.totalPayment).toLocaleString('ru-RU')} у.е.
                            </td>
                            <td className="px-4 py-3 text-right text-blue-600 font-medium">
                              {Math.round(year.totalPrincipal).toLocaleString('ru-RU')} у.е.
                            </td>
                            <td className="px-4 py-3 text-right text-orange-600 font-medium">
                              {Math.round(year.totalInterest).toLocaleString('ru-RU')} у.е.
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {Math.round(year.endingBalance).toLocaleString('ru-RU')} у.е.
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Monthly View */}
                {scheduleView === 'monthly' && (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">Месяц</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Платеж</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Основной долг</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Проценты</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-900">Остаток</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paymentSchedule.map((payment) => (
                          <tr key={payment.month} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{payment.month}</td>
                            <td className="px-4 py-3 text-right text-gray-900">
                              {Math.round(payment.monthlyPayment).toLocaleString('ru-RU')} у.е.
                            </td>
                            <td className="px-4 py-3 text-right text-blue-600 font-medium">
                              {Math.round(payment.principalPayment).toLocaleString('ru-RU')} у.е.
                            </td>
                            <td className="px-4 py-3 text-right text-orange-600 font-medium">
                              {Math.round(payment.interestPayment).toLocaleString('ru-RU')} у.е.
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {Math.round(payment.remainingBalance).toLocaleString('ru-RU')} у.е.
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
