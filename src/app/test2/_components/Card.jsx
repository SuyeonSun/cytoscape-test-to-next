import React from 'react';
import { useAtomValue } from 'jotai';
import { metricMapAtom } from '@/store/graphAtoms';

export default function Card() {
    const metrics = useAtomValue(metricMapAtom);

    return (
        <>
            <style>{`
            .card-container {
            display: flex
            }
        .card {
          border: 1px solid #ddd;
          border-radius: 2px;
          padding: 16px;
          width: 250px;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
          margin: 20px
        }
      `}</style>

            <div className="card-container">
                <div className="card">
                    <div>
                        <div>매출이익</div>
                        <div>{metrics['salesProfit']}</div>
                    </div>
                </div>

                <div className="card">
                    <div>
                        <div>매출액</div>
                        <div>{metrics['revenue']}</div>
                    </div>
                </div>
            </div>
        </>
    );
}
