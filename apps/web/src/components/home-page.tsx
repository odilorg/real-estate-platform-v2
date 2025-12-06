'use client';

import Link from 'next/link';
import { Button, Card, CardContent } from '@repo/ui';
import { Search, MapPin, Home, Building2, Warehouse } from 'lucide-react';

export function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Найдите идеальную недвижимость
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Тысячи объектов недвижимости для покупки и аренды в Узбекистане
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/properties">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Search className="mr-2 h-5 w-5" />
                  Поиск недвижимости
                </Button>
              </Link>
              <Link href="/properties/new">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 border-white text-white hover:bg-white/20"
                >
                  Разместить объявление
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Property Types */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Типы недвижимости
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <Home className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Жилая недвижимость</h3>
                <p className="text-gray-600 mb-4">
                  Квартиры, дома, таунхаусы и кондоминиумы для проживания
                </p>
                <Link href="/properties?type=APARTMENT,HOUSE,CONDO">
                  <Button variant="outline">Смотреть</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <Building2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Коммерческая</h3>
                <p className="text-gray-600 mb-4">
                  Офисы, магазины и помещения для бизнеса
                </p>
                <Link href="/properties?type=COMMERCIAL">
                  <Button variant="outline">Смотреть</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
                  <Warehouse className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Земельные участки</h3>
                <p className="text-gray-600 mb-4">
                  Участки под строительство и сельское хозяйство
                </p>
                <Link href="/properties?type=LAND">
                  <Button variant="outline">Смотреть</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Почему выбирают нас
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Поиск по локации</h3>
              <p className="text-gray-600">
                Ищите недвижимость рядом с вами или в любом районе города
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Расширенные фильтры</h3>
              <p className="text-gray-600">
                Точная настройка параметров поиска: цена, площадь, количество комнат
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Home className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Проверенные объявления</h3>
              <p className="text-gray-600">
                Все объявления проходят модерацию для вашей безопасности
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Готовы найти свою недвижимость?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Зарегистрируйтесь сейчас и получите доступ ко всем функциям
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Создать аккаунт
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
