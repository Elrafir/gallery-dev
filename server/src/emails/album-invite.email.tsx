import { Img, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { ImmichButton } from 'src/emails/components/button.component';
import ImmichLayout from 'src/emails/components/immich.layout';
import { AlbumInviteEmailProps } from 'src/repositories/email.repository';
import { replaceTemplateTags } from 'src/utils/replace-template-tags';

export const AlbumInviteEmail = ({
  baseUrl,
  albumName,
  recipientName,
  senderName,
  albumId,
  cid,
  customTemplate,
}: AlbumInviteEmailProps) => {
  const variables = {
    albumName,
    recipientName,
    senderName,
    albumId,
    baseUrl,
  };

  const emailContent = customTemplate ? (
    replaceTemplateTags(customTemplate, variables)
  ) : (
    <>
      <Text className="m-0">
        Привет, <strong>{recipientName}</strong>!
      </Text>

      <Text>
        {senderName} добавил(а) вас в альбом <strong>{albumName}</strong>.
      </Text>
    </>
  );

  return (
    <ImmichLayout preview={customTemplate ? emailContent.toString() : 'Вас добавили в общий альбом.'}>
      {customTemplate && (
        <Text className="m-0">
          <div dangerouslySetInnerHTML={{ __html: emailContent }}></div>
        </Text>
      )}

      {!customTemplate && emailContent}

      {cid && (
        <Section className="flex justify-center my-0">
          <Img
            className="max-w-[300px] w-full rounded-lg"
            src={`cid:${cid}`}
            style={{
              boxShadow: 'rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px',
            }}
          />
        </Section>
      )}

      <Section className="flex justify-center my-6">
        <ImmichButton href={`${baseUrl}/albums/${albumId}`}>Посмотреть альбом</ImmichButton>
      </Section>

      <Text className="text-xs">
        Если кнопка не работает, используйте ссылку ниже для просмотра альбома.
        <br />
        <Link href={`${baseUrl}/albums/${albumId}`}>{`${baseUrl}/albums/${albumId}`}</Link>
      </Text>
    </ImmichLayout>
  );
};

AlbumInviteEmail.PreviewProps = {
  baseUrl: 'https://demo.immich.app',
  albumName: 'Trip to Europe',
  albumId: 'b63f6dae-e1c9-401b-9a85-9dbbf5612539',
  senderName: 'Owner User',
  recipientName: 'Alan Turing',
} as AlbumInviteEmailProps;

export default AlbumInviteEmail;
