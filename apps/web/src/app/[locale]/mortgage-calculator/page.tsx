import { MortgageCalculatorAdvanced } from '@/components';

export default function MortgageCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Ипотечный калькулятор
          </h1>
          <p className="text-gray-600">
            Рассчитайте ежемесячный платеж и посмотрите детальный график погашения кредита
          </p>
        </div>

        <MortgageCalculatorAdvanced propertyPrice={100000} />

        {/* Additional Info */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Базовая программа</h3>
            <p className="text-sm text-gray-600 mb-2">
              Стандартная ипотечная программа с фиксированной ставкой 14%
            </p>
            <div className="text-2xl font-bold text-blue-600">14%</div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Семейная программа</h3>
            <p className="text-sm text-gray-600 mb-2">
              Льготная ставка для семей с детьми
            </p>
            <div className="text-2xl font-bold text-green-600">6%</div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">IT-ипотека</h3>
            <p className="text-sm text-gray-600 mb-2">
              Специальная программа для IT-специалистов
            </p>
            <div className="text-2xl font-bold text-purple-600">5%</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Обратите внимание:</strong> Расчеты носят информационный характер и могут отличаться от реальных условий банков.
            Для получения точной информации о кредитных программах обратитесь в банк напрямую.
          </p>
        </div>
      </div>
    </div>
  );
}
