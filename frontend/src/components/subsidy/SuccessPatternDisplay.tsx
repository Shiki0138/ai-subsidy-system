'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Factory, 
  Users, 
  DollarSign,
  CheckCircle,
  Info,
  Copy,
  Lightbulb
} from 'lucide-react';
import { SUCCESS_PATTERNS, ACCEPTED_EXAMPLES, PHRASE_TEMPLATES } from '@/data/gyomu-kaizen-success-patterns';

export default function SuccessPatternDisplay() {
  const [selectedIndustry, setSelectedIndustry] = useState('製造業');
  const [copiedText, setCopiedText] = useState('');

  const selectedPattern = SUCCESS_PATTERNS.find(p => p.industry === selectedIndustry);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            業務改善助成金 成功パターン分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <TabsList className="grid grid-cols-5 w-full">
              {SUCCESS_PATTERNS.map(pattern => (
                <TabsTrigger key={pattern.industry} value={pattern.industry}>
                  {pattern.industry}
                </TabsTrigger>
              ))}
            </TabsList>

            {SUCCESS_PATTERNS.map(pattern => (
              <TabsContent key={pattern.industry} value={pattern.industry} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Factory className="h-5 w-5" />
                        推奨設備パターン
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pattern.equipmentPatterns.map((eq, idx) => (
                          <div key={idx} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{eq.name}</h4>
                              <Badge variant="outline">{eq.cost}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{eq.effect}</p>
                            <Badge className="text-xs" variant="secondary">
                              採択率: {eq.acceptanceRate}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        生産性向上指標
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pattern.productivityMetrics.map((metric, idx) => (
                          <div key={idx} className="border rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold">{metric.metric}</h4>
                              <Badge variant="default">{metric.improvement}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{metric.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      賃金引上げ戦略
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">推奨アプローチ</h4>
                        <p className="text-sm text-gray-600 mb-2">{pattern.wageStrategy.approach}</p>
                        <Badge>{pattern.wageStrategy.timing}</Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">期待される効果</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {pattern.wageStrategy.benefits.map((benefit, idx) => (
                            <li key={idx}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>成功のポイント:</strong> {pattern.description}
                  </AlertDescription>
                </Alert>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            採択事例
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {ACCEPTED_EXAMPLES.map((example, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <Badge>{example.industry}</Badge>
                    <Badge variant="outline">{example.year}年度</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium mb-2">{example.companyProfile}</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">設備:</span> {example.equipment}
                    </div>
                    <div>
                      <span className="text-gray-600">成果:</span> {example.result}
                    </div>
                    <div>
                      <span className="text-gray-600">助成額:</span> {example.subsidy}
                    </div>
                  </div>
                  <Alert className="mt-3">
                    <AlertDescription className="text-xs">
                      {example.keySuccess}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-6 w-6" />
            効果的なフレーズ集
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(PHRASE_TEMPLATES).map(([category, phrases]) => (
              <div key={category}>
                <h3 className="font-semibold mb-2 capitalize">{category}</h3>
                <div className="grid gap-2">
                  {Object.entries(phrases).map(([key, phrase]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <p className="text-sm flex-1">{phrase}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(phrase, key)}
                      >
                        {copiedText === key ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}