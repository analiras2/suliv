import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme} from 'native-base';
import {useTranslation} from 'react-i18next';
import {RootStackParamList} from 'src/@types/navigation';
import {
  BaseScreen,
  Header,
  ISectionList,
  IngredientItem,
  Modal,
  PreparationItem,
  SectionList,
  Typography,
} from 'src/components';
import {IIngredient} from 'src/entities';
import {IPreparation} from 'src/entities/recipe/preparation';
import {StackRoutes} from 'src/navigation/stacks';

import React, {useState} from 'react';

import InfoView from './components/InfoView';
import * as St from './styles';

type Props = NativeStackScreenProps<RootStackParamList, StackRoutes.RECIPE>;

const RecipeScreen = ({navigation, route}: Props) => {
  const {t} = useTranslation();
  const theme = useTheme();

  const [showRating, setShowRating] = useState(false);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(1);

  const section: ISectionList<IIngredient | IPreparation>[] = [
    {title: t('recipe.ingredients'), data: route.params.ingredients},
    {title: t('recipe.preparation'), data: route.params.preparation},
  ];

  return (
    <BaseScreen
      id={route.name}
      noPadding
      hideScroll
      header={{
        type: Header.TYPE.ACTION,
        title: route.params.title,
        onBackPress: () => navigation.pop(),
        actionButton: {
          icon: 'share-variant-outline',
          onPress: () => console.log('Compartilhar'),
        },
      }}>
      <St.Image
        alt={`Foto receita ${route.params.title}`}
        theme={theme}
        source={{uri: 'https://wallpaperaccess.com/full/317501.jpg'}}
      />
      <InfoView recipe={route.params} />
      <St.Container>
        <St.Rating onPress={() => setShowRating(true)} />
        <SectionList
          list
          sections={section}
          renderHeader={({title}) => {
            return (
              <Typography mb={2} type={Typography.TYPE.TINY_TITLE}>
                {title}
              </Typography>
            );
          }}
          renderItem={({item}) =>
            'quantity' in item ? (
              <IngredientItem item={item} />
            ) : (
              <PreparationItem item={item} />
            )
          }
        />
      </St.Container>
      {showRating && (
        <Modal
          visible={showRating}
          onClose={() => setShowRating(false)}
          onSubmit={() => {
            console.log('Enviar', rating, 'Comment', comment);
            setShowRating(false);
            setComment('');
          }}>
          <>
            <St.Rating getRatting={setRating} />
            <St.CommentInput
              theme={theme}
              onChangeText={(text: string) => setComment(text)}
              value={comment}
              placeholder={t('rating.leaveComment')}
            />
          </>
        </Modal>
      )}
    </BaseScreen>
  );
};

export default RecipeScreen;
