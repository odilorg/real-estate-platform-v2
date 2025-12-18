'use client';

import { Card, CardContent } from '@repo/ui';
import { Star, Building2, Home, CheckCircle2 } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface Agency {
  id: string;
  name: string;
  logo?: string | null;
  yearsOnPlatform: number;
  verified: boolean;
}

interface Agent {
  id: string;
  photo?: string | null;
  phone?: string | null;
  email?: string | null;
  yearsExperience: number;
  totalDeals: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  superAgent: boolean;
  agency?: Agency | null;
}

interface DeveloperInfoCardProps {
  agent?: Agent | null;
  userName: string;
  userRole: string;
}

export function DeveloperInfoCard({ agent, userName, userRole }: DeveloperInfoCardProps) {
  // If no agent data, show basic user info
  if (!agent) {
    return (
      <Card>
        <CardContent className="p-6 bg-gray-50">
          <div className="space-y-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {userRole === 'AGENT' ? 'АГЕНТ' : 'КОНТАКТ'}
            </div>
            <div className="font-semibold text-gray-900">{userName}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayName = agent.agency?.name || userName;
  const logo = agent.agency?.logo || agent.photo;
  const yearsActive = agent.agency?.yearsOnPlatform || agent.yearsExperience;
  const isVerified = agent.agency?.verified || agent.verified;

  return (
    <Card>
      <CardContent className="p-6 bg-gray-50">
        <div className="space-y-4">
          {/* Developer logo and name */}
          <div className="flex items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt={displayName}
                className="w-16 h-16 rounded-lg object-cover bg-gray-800"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {agent.agency ? 'ЗАСТРОЙЩИК' : 'АГЕНТ'}
              </div>
              <div className="font-bold text-lg text-gray-900 truncate">
                {displayName}
              </div>
            </div>
          </div>

          {/* Rating */}
          {agent.rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-lg">{agent.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-600">
                {agent.reviewCount} {agent.reviewCount === 1 ? 'отзыв' : 'отзыва'}
              </span>
              {isVerified && (
                <CheckCircle2 className="h-5 w-5 text-blue-600 ml-auto" />
              )}
            </div>
          )}

          {/* Statistics */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Год основания</span>
              <span className="font-semibold">
                {new Date().getFullYear() - yearsActive}
              </span>
            </div>

            {agent.agency && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Жилых комплексов</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Домов строится</span>
                  <span className="font-semibold">4 дома в 2 ЖК</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Сдано</span>
                  <span className="font-semibold">20 домов в 10 ЖК</span>
                </div>
              </>
            )}

            {!agent.agency && agent.totalDeals > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Сделок проведено</span>
                <span className="font-semibold">{agent.totalDeals}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
