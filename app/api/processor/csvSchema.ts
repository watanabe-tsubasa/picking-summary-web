import pl from "nodejs-polars"

export const schema = {
  '注文番号': pl.Utf8,
  '外部注文番号': pl.Utf8,
  '注文タイプ': pl.Utf8,
  'お支払い方式': pl.Utf8,
  '配送方法': pl.Utf8,
  '荷受け人': pl.Utf8,
  '荷受人携帯番号': pl.Utf8,
  '配送地域コード': pl.Utf8,
  '配送地域': pl.Utf8,
  '配送エリア': pl.Utf8,
  '郵便番号': pl.Utf8,
  '詳細住所': pl.Utf8,
  '配送日付': pl.Utf8,
  '配送時間': pl.Utf8,
  '手数料': pl.Float64,
  '配送料': pl.Float64,
  '備考': pl.Utf8,
  '枠番号': pl.Utf8,
  '商品コード': pl.Utf8,
  '商品名称': pl.Utf8,
  '温度帯': pl.Utf8,
  'ユーザー購入数量': pl.Int32,
  'ピッキング数量': pl.Int32,
  '欠品数量': pl.Int32,
  '代替品数量': pl.Int32,
  '商品価格': pl.Float64,
  '商品ステータス': pl.Utf8,
  '代替商品コード': pl.Utf8,
  '代替商品名称': pl.Utf8,
  '商品税率タイプ': pl.Utf8,
  '商品税率': pl.Float64,
  '明細修正': pl.Utf8,
}