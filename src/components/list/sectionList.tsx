import {FlatList, View} from 'react-native';

import React from 'react';

export interface ISectionList<T> {
  title: string;
  data: T[];
}

interface IHeader {
  title: string;
  index: number;
}

interface IFunction<T> {
  item: T;
  index: number;
}

interface Props<T> {
  sections: ISectionList<T>[];
  list?: boolean;
  renderHeader: (section: IHeader) => React.ReactElement;
  renderItem: (data: IFunction<T>) => React.ReactElement;
}
function SectionList<T>({sections, list, renderHeader, renderItem}: Props<T>) {
  return (
    <FlatList
      data={sections}
      keyExtractor={(_, index) => `category-${index}`}
      renderItem={({item, index}) => (
        // eslint-disable-next-line react-native/no-inline-styles
        <View style={{paddingTop: index >= 1 ? 20 : 0}}>
          {renderHeader({title: item.title, index})}
          <FlatList
            data={item.data}
            keyExtractor={(_, pos) => `recipe-${pos}`}
            numColumns={list ? undefined : 2}
            renderItem={recipe => renderItem(recipe)}
          />
        </View>
      )}
    />
  );
}

export default SectionList;
